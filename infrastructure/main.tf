provider azurerm {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "${var.product}-${var.env}"
  location = var.location

  tags = var.common_tags
}

module "key-vault" {
  source              = "git@github.com:hmcts/cnp-module-key-vault?ref=master"
  product             = var.product
  env                 = var.env
  tenant_id           = var.tenant_id
  object_id           = var.jenkins_AAD_objectId
  resource_group_name = azurerm_resource_group.rg.name

  # dcd_platformengineering group object ID
  product_group_name = "DTS CFT Developers"
  common_tags                = var.common_tags
  create_managed_identity    = true
}

resource "azurerm_key_vault_secret" "AZURE_APPINSIGHTS_KEY" {
  name         = "AppInsightsConnectionString"
  value        = azurerm_application_insights.appinsights.connection_string
  key_vault_id = module.key-vault.key_vault_id
}

resource "azurerm_application_insights" "appinsights" {
  name                = "${var.product}-appinsights-${var.env}"
  location            = var.appinsights_location
  resource_group_name = azurerm_resource_group.rg.name
  application_type    = "web"

  tags = var.common_tags

  lifecycle {
    ignore_changes = [
      # Ignore changes to appinsights as otherwise upgrading to the Azure provider 2.x
      # destroys and re-creates this appinsights instance..
      application_type,
    ]
  }
}
