# Hardware Button

## Phase 1: USB Macro Key

Use any programmable USB macro key that behaves as a standard HID keyboard.
Configure its only key as a held `F8` key, not a one-shot macro:

| Button event | Keyboard action |
| --- | --- |
| Press | Hold `F8` |
| Release | Release `F8` |

The computer helper is already configured for this shortcut. The key must send distinct press and release events; a macro that taps the shortcut will create an almost empty recording.

## One-Time Computer Setup

```powershell
npm start
```

Test by placing focus in an OpenCode text input, holding the macro key while speaking Chinese, and releasing it. The result is pasted into the focused input. Press Enter yourself to send it.

To start the helper automatically after signing in:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-autostart.ps1
```

The background launcher's output is written to `opencode-stt.log` in this project. Remove login autostart with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/remove-autostart.ps1
```

## Phase 2: Dedicated Button

Replace the macro key with a Raspberry Pi Pico or Seeed XIAO RP2040, one momentary switch, and a USB cable. Firmware should expose a USB HID keyboard and implement the same behavior:

```text
button pressed  -> keyDown(F8)
button released -> keyUp(F8)
```

No change is needed in the Windows application, STT model, or OpenCode workflow. QMK, CircuitPython, and TinyUSB firmware are all suitable because the device only needs to emulate a standard USB keyboard.

## Boundaries

The USB button does not record or process audio. It deliberately stays a keyboard-only device, while the local helper uses the computer's microphone and local model. This keeps the hardware simple, lets the button work without drivers, and makes the later self-built button interchangeable with the macro key.
