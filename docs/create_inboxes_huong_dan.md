curl --request POST \
 --url https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes \
 --header 'Content-Type: application/json' \
 --header 'api_access_token: <api-key>' \
 --data '
{
"name": "API Inbox",
"greeting_enabled": true,
"greeting_message": "Hello, how can I help you?",
"enable_auto_assignment": true,
"working_hours_enabled": true,
"timezone": "America/New_York",
"channel": {
"type": "api",
"webhook_url": "https://example.com/webhook",
"hmac_mandatory": false,
"additional_attributes": {
"source": "mobile_app"
}
}
}
'

curl --request POST \
 --url https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes \
 --header 'Content-Type: application/json' \
 --header 'api_access_token: <api-key>' \
 --data '
{
"name": "Email Inbox",
"greeting_enabled": true,
"greeting_message": "Hello, how can I help you?",
"enable_auto_assignment": true,
"working_hours_enabled": true,
"timezone": "America/New_York",
"channel": {
"type": "email",
"email": "support@example.com",
"imap_enabled": false,
"smtp_enabled": false
}
}
'

curl --request POST \
 --url https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes \
 --header 'Content-Type: application/json' \
 --header 'api_access_token: <api-key>' \
 --data '
{
"name": "LINE Inbox",
"greeting_enabled": true,
"greeting_message": "Hello, how can I help you?",
"enable_auto_assignment": true,
"working_hours_enabled": true,
"timezone": "America/New_York",
"channel": {
"type": "line",
"line_channel_id": "1234567890",
"line_channel_secret": "line-channel-secret",
"line_channel_token": "line-channel-token"
}
}
'

curl --request POST \
 --url https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes \
 --header 'Content-Type: application/json' \
 --header 'api_access_token: <api-key>' \
 --data '
{
"name": "Telegram Inbox",
"greeting_enabled": true,
"greeting_message": "Hello, how can I help you?",
"enable_auto_assignment": true,
"working_hours_enabled": true,
"timezone": "America/New_York",
"channel": {
"type": "telegram",
"bot_token": "123456789:telegram-bot-token"
}
}
'

curl --request POST \
 --url https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes \
 --header 'Content-Type: application/json' \
 --header 'api_access_token: <api-key>' \
 --data '
{
"name": "WhatsApp Inbox",
"greeting_enabled": true,
"greeting_message": "Hello, how can I help you?",
"enable_auto_assignment": true,
"working_hours_enabled": true,
"timezone": "America/New_York",
"channel": {
"type": "whatsapp",
"phone_number": "+15551234567",
"provider": "whatsapp_cloud",
"provider_config": {
"api_key": "your-api-key",
"phone_number_id": "your-phone-number-id",
"business_account_id": "your-business-account-id"
}
}
}
'

curl --request POST \
 --url https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes \
 --header 'Content-Type: application/json' \
 --header 'api_access_token: <api-key>' \
 --data '
{
"name": "SMS Inbox",
"greeting_enabled": true,
"greeting_message": "Hello, how can I help you?",
"enable_auto_assignment": true,
"working_hours_enabled": true,
"timezone": "America/New_York",
"channel": {
"type": "sms",
"phone_number": "+15551234567",
"provider_config": {
"api_key": "your-api-key",
"api_secret": "your-api-secret",
"application_id": "your-application-id",
"account_id": "your-account-id"
}
}
}
'
