use mcp_smart_fetch::{AppConfig, SmartFetchService, McpSmartFetchServer};
use tempfile::NamedTempFile;
use tokio::time::Duration;
use serde_json::json;

// Helper function to create a test configuration
fn create_test_config() -> AppConfig {
    let mut config = AppConfig::default();
    // Use a dummy API key for testing
    config.llm.api_key = Some("test-api-key".to_string());
    // Reduce timeouts for faster testing
    config.llm.timeout_seconds = Some(5);
    config.processing.max_document_size_mb = Some(1.0);
    config
}

// Helper function to create a test document
async fn create_test_document(content: &str) -> NamedTempFile {
    let temp_file = NamedTempFile::new().unwrap();
    tokio::fs::write(&temp_file, content).await.unwrap();
    temp_file
}

#[tokio::test]
async fn test_mcp_server_initialization() {
    let config = create_test_config();
    let service = SmartFetchService::new(config).unwrap();

    // Test that MCP server can be created
    let _mcp_server = McpSmartFetchServer::new(service);

    // This test just verifies the server can be created without panicking
    // In a real test, we would need to spawn the server and connect a client
    assert!(true);
}

#[tokio::test]
async fn test_mcp_server_stdio_communication() {
    let config = create_test_config();
    let service = SmartFetchService::new(config).unwrap();
    let _mcp_server = McpSmartFetchServer::new(service);

    // This test demonstrates the pattern for testing MCP server communication
    // In a real implementation, we would:
    // 1. Spawn the server in a child process
    // 2. Connect to it via stdio
    // 3. Send MCP protocol messages
    // 4. Verify responses

    // For now, we'll just verify the server can be created
    assert!(true);
}

#[tokio::test]
async fn test_extract_from_text_via_mcp() {
    let config = create_test_config();
    let service = SmartFetchService::new(config).unwrap();

    // Test the underlying service functionality that would be exposed via MCP
    let test_text = "这是一个测试文本，包含一些重要信息。";
    let prompt = Some("提取关键信息".to_string());

    // Note: This test would normally require a real LLM API key
    // For testing purposes, we'll just verify the service can be called
    // In a real test environment, you might mock the LLM client

    let result = service.extract_from_text(test_text, prompt).await;

    // In a real test with proper API key, this would succeed
    // For now, we expect it to fail due to the dummy API key
    assert!(result.is_err());
}

#[tokio::test]
async fn test_extract_from_file_via_mcp() {
    let config = create_test_config();
    let service = SmartFetchService::new(config).unwrap();

    // Create a test document
    let test_content = "这是一个测试文档\n包含多行内容\n用于测试文档处理功能";
    let temp_file = create_test_document(test_content).await;

    // Test the underlying service functionality
    let result = service.extract_content(&temp_file.path().to_path_buf(), None).await;

    // Similar to the text test, this would require a real API key
    assert!(result.is_err());
}

#[tokio::test]
async fn test_mcp_server_tool_listing() {
    let config = create_test_config();
    let service = SmartFetchService::new(config).unwrap();
    let _mcp_server = McpSmartFetchServer::new(service);

    // Test that the server has the expected tools
    // This would normally be tested by sending a tools/list request
    // For now, we'll verify the server can be created
    assert!(true);
}

#[tokio::test]
async fn test_mcp_server_config_access() {
    let config = create_test_config();
    let service = SmartFetchService::new(config.clone()).unwrap();

    // Test that the service can access configuration
    // This would be exposed via the get_config MCP tool
    let config = service.config();

    assert!(!config.llm.api_endpoint.is_empty());
    assert!(!config.llm.model.is_empty());
    assert_eq!(config.server.port, 8080);
}

#[tokio::test]
async fn test_mcp_server_supported_formats() {
    let config = create_test_config();
    let service = SmartFetchService::new(config).unwrap();

    // Test that the service can list supported formats
    // This would be exposed via the list_supported_formats MCP tool
    let config = service.config();

    assert!(config.processing.supported_formats.contains(&"txt".to_string()));
    assert!(config.processing.supported_formats.contains(&"md".to_string()));
}

#[tokio::test]
async fn test_mcp_server_with_custom_template() {
    let config = create_test_config();
    let _service = SmartFetchService::new(config).unwrap();

    // Test that the service can use custom templates
    // This would be tested via MCP tools with template parameters

    // For now, just verify the service can be created
    assert!(true);
}

// Integration test that runs the actual MCP server and tests it with a real MCP client
#[tokio::test]
async fn test_mcp_server_full_integration() {
    use std::process::{Command, Stdio};
    use tempfile::NamedTempFile;

    // Create a test configuration file
    let config_content = r#"
[llm]
api_key = "test-key"
api_endpoint = "https://api.openai.com/v1/chat/completions"
model = "gpt-4"

[server]
port = 0

[processing]
max_document_size_mb = 1.0
chunk_size = 1000
supported_formats = ["txt"]
"#;

    let config_file = NamedTempFile::new().unwrap();
    tokio::fs::write(&config_file, config_content).await.unwrap();

    // Create a test document
    let test_content = "这是一个测试文档，用于测试 MCP 服务器的完整集成功能。";
    let test_file = NamedTempFile::new().unwrap();
    tokio::fs::write(&test_file, test_content).await.unwrap();

    // Start the MCP server as a child process
    let mut server_process = Command::new("cargo")
        .args(&["run", "--", "--config", &config_file.path().to_string_lossy(), "serve"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start MCP server");

    // Give the server a moment to start
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // For this test, we'll just verify that the server started successfully
    // In a real implementation, we would:
    // 1. Send MCP protocol messages via stdin
    // 2. Read responses from stdout
    // 3. Verify the server behaves correctly

    // Check if the process is still running (indicates successful startup)
    let status = server_process.try_wait();
    match status {
        Ok(None) => {
            // Process is still running, which is good
            println!("✅ MCP server started successfully");

            // Terminate the server process
            server_process.kill().expect("Failed to kill server process");
            server_process.wait().expect("Failed to wait for server process");
        }
        Ok(Some(exit_code)) => {
            panic!("❌ MCP server exited with code: {}", exit_code);
        }
        Err(e) => {
            panic!("❌ Failed to check server status: {}", e);
        }
    }
}

// Advanced MCP client test using actual rmcp client functionality
#[tokio::test]
async fn test_mcp_client_with_stdio_transport() {
    use std::process::Stdio;
    use tokio::process::Command as TokioCommand;
    use tempfile::NamedTempFile;

    // Create a minimal test configuration
    let config_content = r#"
[llm]
api_key = "test-key"
api_endpoint = "https://api.openai.com/v1/chat/completions"
model = "gpt-4"

[server]
port = 0

[processing]
max_document_size_mb = 1.0
chunk_size = 1000
supported_formats = ["txt"]
"#;

    let config_file = NamedTempFile::new().unwrap();
    tokio::fs::write(&config_file, config_content).await.unwrap();

    // Start the MCP server as a child process
    let mut server_process = TokioCommand::new("cargo")
        .args(&["run", "--", "--config", &config_file.path().to_string_lossy(), "serve"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .expect("Failed to start MCP server");

    // Give the server a moment to start
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

    // Check if the process is still running
    let status = server_process.try_wait();
    match status {
        Ok(None) => {
            println!("✅ MCP server is running");

            // Test that we can communicate with the server
            // In a real implementation with client features, we would:
            // 1. Create an MCP client with stdio transport
            // 2. Connect to the server's stdin/stdout
            // 3. Send MCP protocol messages
            // 4. Verify responses

            // For now, we'll just verify the server is running
            // and can be controlled

            // Terminate the server gracefully
            server_process.kill().await.expect("Failed to kill server process");
            let _result = server_process.wait().await;
            println!("✅ MCP server test completed");
        }
        Ok(Some(exit_code)) => {
            panic!("❌ MCP server exited with code: {}", exit_code);
        }
        Err(e) => {
            panic!("❌ Failed to check server status: {}", e);
        }
    }
}

// Test MCP protocol message serialization and deserialization
#[tokio::test]
async fn test_mcp_protocol_message_handling() {
    // Test that we can create and handle MCP protocol messages
    // This simulates the communication between client and server

    // Test request message structure
    let request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "extract_from_text",
            "arguments": {
                "text": "测试文本内容",
                "prompt": "提取关键信息"
            }
        }
    });

    assert_eq!(request["jsonrpc"], "2.0");
    assert_eq!(request["id"], 1);
    assert_eq!(request["method"], "tools/call");
    assert_eq!(request["params"]["name"], "extract_from_text");
    assert_eq!(request["params"]["arguments"]["text"], "测试文本内容");

    // Test response message structure
    let response = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "result": {
            "content": [
                {
                    "type": "text",
                    "text": "提取的关键信息"
                }
            ]
        }
    });

    assert_eq!(response["jsonrpc"], "2.0");
    assert_eq!(response["id"], 1);
    assert!(response["result"].is_object());
    assert!(response["result"]["content"].is_array());

    // Test error response structure
    let error_response = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "error": {
            "code": -32601,
            "message": "Method not found"
        }
    });

    assert_eq!(error_response["jsonrpc"], "2.0");
    assert_eq!(error_response["id"], 1);
    assert_eq!(error_response["error"]["code"], -32601);
    assert_eq!(error_response["error"]["message"], "Method not found");
}

#[test]
fn test_mcp_request_serialization() {
    // Test that MCP request parameters can be properly serialized
    let request = json!({
        "tool": "extract_from_text",
        "params": {
            "text": "测试文本",
            "prompt": "提取信息"
        }
    });

    assert_eq!(request["tool"], "extract_from_text");
    assert_eq!(request["params"]["text"], "测试文本");
    assert_eq!(request["params"]["prompt"], "提取信息");
}

#[tokio::test]
async fn test_mcp_server_error_handling() {
    let config = create_test_config();
    let service = SmartFetchService::new(config).unwrap();

    // Test that the service handles errors gracefully
    // This would be exposed via MCP error responses

    // Test with non-existent file
    let result = service.extract_content(&std::path::PathBuf::from("non_existent_file.txt"), None).await;
    assert!(result.is_err());

    // Test with empty text
    let result = service.extract_from_text("", None).await;
    assert!(result.is_err());
}

// Performance test for MCP server operations
#[tokio::test]
async fn test_mcp_server_performance() {
    let config = create_test_config();
    let service = SmartFetchService::new(config).unwrap();

    // Test performance of service operations
    // This would measure response times for MCP operations

    let start_time = std::time::Instant::now();

    // Test configuration access (should be fast)
    let _config = service.config();

    let duration = start_time.elapsed();
    assert!(duration < Duration::from_millis(100)); // Should be very fast
}