// Infrastructural variables

variable "product" {}
variable "component" {}

variable "location" {
  default = "UK South"
}

variable "managed_identity_object_id" {
  default = ""
}

variable "env" {}
variable "tenant_id" {}

variable "ilbIp" { }

variable "subscription" {}

// CNP settings
variable "jenkins_AAD_objectId" {
  description = "(Required) The Azure AD object ID of a user, service principal or security group in the Azure Active Directory tenant for the vault. The object ID must be unique for the list of access policies."
}

variable "common_tags" {
  type = map(string)
}
