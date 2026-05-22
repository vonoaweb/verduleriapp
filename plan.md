# Plan: Automatización WhatsApp - Frutas y Verduras

## Descripción del Proyecto
Sistema de automatización para un negocio de frutas y verduras que permite a clientes cotizar productos via WhatsApp y al administrador gestionar productos, precios y cotizaciones desde un panel web.

## Stage 1 - Diseño y Configuración Inicial
- Definir arquitectura: React + API de WhatsApp Business (simulada con webhook local)
- Diseñar base de datos de productos (frutas/verduras con precios por kg/unidad)
- Crear flujo de conversación del chatbot

## Stage 2 - Backend (API)
- Crear servidor Express con endpoints para:
  - CRUD de productos (frutas/verduras)
  - Gestión de cotizaciones
  - Webhook para recibir mensajes de WhatsApp
  - Respuestas automáticas del bot

## Stage 3 - Frontend (Panel de Administración)
- Panel web para gestionar productos
- Lista de cotizaciones recibidas
- Configuración de precios

## Stage 4 - Simulador de WhatsApp
- Interfaz de chat simulando WhatsApp para probar el bot sin necesidad de cuenta real

## Stage 5 - Integración y Deploy
- Integrar frontend + backend + simulador
- Deploy de la aplicación web
