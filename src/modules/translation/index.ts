import { Module } from "@medusajs/framework/utils"
import TranslationModuleService from "./service"

export const TRANSLATION_MODULE = "translation"

export default Module(TRANSLATION_MODULE, {
  service: TranslationModuleService,
})