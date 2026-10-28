---
name: escribir-ears
description: Redacta o corrige requisitos de Pointer en notación EARS para que sean claros y comprobables. Usar al escribir o revisar una spec.md (lo usan /spec y /clarificar).
---

# Skill: escribir-ears

EARS (*Easy Approach to Requirements Syntax*) obliga a escribir cada requisito con una estructura fija, para que no haya ambigüedad y se pueda probar.

## Los cinco patrones

| Patrón | Plantilla | Ejemplo en Pointer |
|---|---|---|
| **Siempre** (ubicuo) | El sistema **deberá** … | El sistema deberá calcular el total de la venta con los precios guardados en la base. |
| **Evento** | **Cuando** <evento>, el sistema **deberá** … | Cuando el lector envíe un código existente, el sistema deberá agregar el producto a la venta con cantidad 1. |
| **Estado** | **Mientras** <estado>, el sistema **deberá** … | Mientras la caja esté cerrada, el sistema deberá deshabilitar el botón Cobrar. |
| **No deseado** | **Si** <condición>, **entonces** el sistema **deberá** … | Si el código escaneado no existe, entonces el sistema deberá mostrar «No encontramos ese producto». |
| **Opcional** | **Donde** <característica>, el sistema **deberá** … | Donde el usuario sea dueño, el sistema deberá mostrar el costo de cada producto. |

Se pueden combinar: «**Mientras** la caja esté abierta, **cuando** el dueño cancele una venta en efectivo, el sistema **deberá** restar el total del saldo de la caja.»

## Reglas para Pointer

1. **Un requisito = una oración = un comportamiento.** Si tiene «y» entre dos acciones distintas, se divide.
2. Siempre **«el sistema deberá»**: nunca «debería», «podría» ni «se intentará».
3. **Medible:** nada de «rápido», «fácil» o «amigable» sin un número («en menos de 2 segundos», «con 2 clics»).
4. Los nombres de pantallas, roles y estados son los de `docs/05-DATOS.md` y `docs/06-DISENO-UI.md` (`dueno`, `empleado`, `abierta`, `cerrada`, `completada`, `cancelada`).
5. Los textos que ve el usuario se escriben entre comillas, en voseo, tal cual van a aparecer.
6. Numeración: `RF-NNN-01`, donde NNN es el número de la spec. Cada RF lleva prioridad **Alta**, **Media** o **Baja**.
7. Cada RF de prioridad Alta tiene que poder probarse con un test automático o con una prueba manual descrita.

## Cómo revisar un requisito existente

| Problema | Antes | Después (EARS) |
|---|---|---|
| Ambiguo | «El sistema debe manejar bien la falta de stock.» | Si la cantidad pedida supera el stock disponible, entonces el sistema deberá rechazar la venta y mostrar «Stock insuficiente de <producto> (disponible: N)». |
| Dos acciones | «Al cobrar se descuenta el stock y se imprime el ticket.» | RF-a: Cuando se confirme el cobro, el sistema deberá descontar el stock de cada producto. RF-b: Cuando la venta quede registrada, el sistema deberá mostrar el ticket con la opción «Imprimir». |
| No medible | «La búsqueda debe ser rápida.» | Cuando el usuario escriba al menos 2 letras, el sistema deberá mostrar los productos que coinciden en menos de 1 segundo. |

## Salida

La tabla de requisitos lista para pegar en `spec.md`:

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-01 | Cuando … , el sistema deberá … | Evento | Alta |
