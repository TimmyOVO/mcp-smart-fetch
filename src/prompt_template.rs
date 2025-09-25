use crate::error::{Result, SmartFetchError};
use handlebars::Handlebars;
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize)]
pub struct TemplateData {
    pub content: String,
    pub custom_prompt: Option<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug)]
pub struct TemplateManager {
    handlebars: Handlebars<'static>,
    templates_dir: PathBuf,
}

impl TemplateManager {
    pub fn new(templates_dir: &Path) -> Result<Self> {
        let mut handlebars = Handlebars::new();
        handlebars.set_strict_mode(true);

        // 注册自定义助手
        handlebars.register_helper("truncate", Box::new(truncate_helper));
        handlebars.register_helper("word_count", Box::new(word_count_helper));
        handlebars.register_helper("line_count", Box::new(line_count_helper));

        let mut manager = Self {
            handlebars,
            templates_dir: templates_dir.to_path_buf(),
        };

        // 确保模板目录存在
        if !manager.templates_dir.exists() {
            fs::create_dir_all(&manager.templates_dir)?;
        }

        // 加载所有模板
        manager.load_templates()?;

        Ok(manager)
    }

    fn load_templates(&mut self) -> Result<()> {
        if !self.templates_dir.exists() {
            return Ok(());
        }

        for entry in fs::read_dir(&self.templates_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "hbs" || ext == "html" || ext == "mustache" {
                        let template_name =
                            path.file_stem().and_then(|s| s.to_str()).ok_or_else(|| {
                                SmartFetchError::TemplateError(format!(
                                    "无效的模板文件名: {:?}",
                                    path
                                ))
                            })?;

                        let content = fs::read_to_string(&path).map_err(|e| {
                            SmartFetchError::TemplateError(format!(
                                "读取模板文件失败: {} - {}",
                                template_name, e
                            ))
                        })?;

                        self.handlebars
                            .register_template_string(template_name, content)
                            .map_err(|e| {
                                SmartFetchError::TemplateError(format!(
                                    "注册模板失败: {} - {}",
                                    template_name, e
                                ))
                            })?;
                    }
                }
            }
        }

        Ok(())
    }

    pub fn render_template(
        &self,
        template_name: &str,
        content: &str,
        custom_prompt: Option<String>,
    ) -> Result<String> {
        let mut metadata = HashMap::new();
        metadata.insert("content_length".to_string(), content.len().to_string());
        metadata.insert(
            "word_count".to_string(),
            content.split_whitespace().count().to_string(),
        );
        metadata.insert(
            "line_count".to_string(),
            content.lines().count().to_string(),
        );

        let template_data = TemplateData {
            content: content.to_string(),
            custom_prompt,
            metadata,
        };

        let rendered = self
            .handlebars
            .render(template_name, &template_data)
            .map_err(|e| {
                SmartFetchError::TemplateError(format!("渲染模板失败: {} - {}", template_name, e))
            })?;

        Ok(rendered)
    }

    pub fn render_template_with_data(
        &self,
        template_name: &str,
        data: &TemplateData,
    ) -> Result<String> {
        let rendered = self.handlebars.render(template_name, data).map_err(|e| {
            SmartFetchError::TemplateError(format!("渲染模板失败: {} - {}", template_name, e))
        })?;

        Ok(rendered)
    }

    pub fn get_available_templates(&self) -> Vec<String> {
        self.handlebars.get_templates().keys().cloned().collect()
    }

    pub fn template_exists(&self, template_name: &str) -> bool {
        self.handlebars.get_template(template_name).is_some()
    }

    pub fn register_template_string(&mut self, name: &str, template: &str) -> Result<()> {
        self.handlebars
            .register_template_string(name, template)
            .map_err(|e| {
                SmartFetchError::TemplateError(format!("注册模板失败: {} - {}", name, e))
            })?;
        Ok(())
    }

    pub fn reload_templates(&mut self) -> Result<()> {
        // 清除现有模板
        self.handlebars.clear_templates();

        // 重新加载
        self.load_templates()?;
        Ok(())
    }

    pub fn validate_template(&self, template_content: &str) -> Result<()> {
        // 创建临时handlebars实例进行验证
        let mut temp_handlebars = Handlebars::new();
        temp_handlebars
            .register_template_string("validation_template", template_content)
            .map_err(|e| SmartFetchError::TemplateError(format!("模板验证失败: {}", e)))?;

        // 尝试渲染以验证语法
        let test_data = TemplateData {
            content: "测试内容".to_string(),
            custom_prompt: Some("测试提示词".to_string()),
            metadata: HashMap::new(),
        };

        temp_handlebars
            .render("validation_template", &test_data)
            .map_err(|e| SmartFetchError::TemplateError(format!("模板渲染验证失败: {}", e)))?;

        Ok(())
    }
}

// 自定义助手函数
fn truncate_helper(
    h: &handlebars::Helper<'_>,
    _: &Handlebars<'_>,
    _: &handlebars::Context,
    _: &mut handlebars::RenderContext<'_, '_>,
    out: &mut dyn handlebars::Output,
) -> handlebars::HelperResult {
    let text = h.param(0).unwrap().value().as_str().unwrap_or("");
    let limit = h.param(1).unwrap().value().as_u64().unwrap_or(100);

    let truncated = if text.len() > limit as usize {
        format!("{}...", &text[..limit as usize])
    } else {
        text.to_string()
    };

    out.write(&truncated)?;
    Ok(())
}

fn word_count_helper(
    h: &handlebars::Helper<'_>,
    _: &Handlebars<'_>,
    _: &handlebars::Context,
    _: &mut handlebars::RenderContext<'_, '_>,
    out: &mut dyn handlebars::Output,
) -> handlebars::HelperResult {
    let text = h.param(0).unwrap().value().as_str().unwrap_or("");
    let count = text.split_whitespace().count();
    out.write(&count.to_string())?;
    Ok(())
}

fn line_count_helper(
    h: &handlebars::Helper<'_>,
    _: &Handlebars<'_>,
    _: &handlebars::Context,
    _: &mut handlebars::RenderContext<'_, '_>,
    out: &mut dyn handlebars::Output,
) -> handlebars::HelperResult {
    let text = h.param(0).unwrap().value().as_str().unwrap_or("");
    let count = text.lines().count();
    out.write(&count.to_string())?;
    Ok(())
}
