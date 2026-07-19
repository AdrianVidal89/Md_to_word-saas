---
title: Informe de Pruebas de Sistema
author: Equipo QA
confidentiality: Internal Use Only
owner: Adrian Vidal
reviewer: QA Lead
approver: Engineering Manager
---

# Resumen ejecutivo

Este documento resume los resultados de la ronda de **pruebas de sistema**
ejecutada sobre la última entrega. Se incluyen *observaciones*, `logs`
relevantes y el detalle de casos en la tabla de resultados.

Más información en el [portal de QA](https://example.com/qa).

> Todas las pruebas se ejecutaron en el entorno de staging antes del pase a
> producción.

## Alcance

- Autenticación y gestión de sesión
- Conversión de documentos Markdown a Word
- Límites de cuota freemium
- Integración B2B vía API Key

## Casos de prueba

1. Login con credenciales válidas
2. Conversión sin plantilla personalizada
3. Conversión con plantilla personalizada (usuario free)
4. Conversión B2B autenticada con API Key

### Resultados detallados

| Caso                              | Resultado |
|------------------------------------|-----------|
| Login válido                       | PASS      |
| Login inválido devuelve 401        | PASS      |
| Cuota freemium bloquea 4ª conversión| PASS      |
| Plantilla custom sin tier pro       | FAIL      |
| B2B con API Key inválida            | OK        |
| B2B con API Key revocada            | KO        |

---

## Notas finales

Los casos marcados como `FAIL` requieren seguimiento antes del cierre del
sprint.
