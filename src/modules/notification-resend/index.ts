import { Module } from "@medusajs/framework/utils"
import ResendNotificationService from "./service"

export const RESEND_NOTIFICATION_MODULE = "resendNotificationModule"

export default Module(RESEND_NOTIFICATION_MODULE, {
  service: ResendNotificationService,
})