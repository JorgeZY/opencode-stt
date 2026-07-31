import json
import queue
import socket
import threading
import tkinter as tk
import ctypes


TRANSPARENT = "#ff00ff"
PALETTE = {
    "LightSteelBlue": "#9bb4cd",
    "MediumSpringGreen": "#67db9a",
    "DeepSkyBlue": "#4bbdf2",
    "Gold": "#f4c765",
}


class Pet:
    def __init__(self):
        self.events = queue.Queue()
        self.text = ""
        self.color = PALETTE["LightSteelBlue"]
        self.level = 0.0
        self.phase = 0

        self.root = tk.Tk()
        self.root.overrideredirect(True)
        self.root.configure(bg=TRANSPARENT)
        self.root.wm_attributes("-transparentcolor", TRANSPARENT)
        self.root.wm_attributes("-topmost", True)
        self.root.attributes("-alpha", 0.98)
        self.root.geometry("310x235+%d+%d" % (self.root.winfo_screenwidth() - 340, self.root.winfo_screenheight() - 315))

        self.canvas = tk.Canvas(self.root, width=310, height=235, highlightthickness=0, bg=TRANSPARENT)
        self.canvas.pack()
        self.canvas.bind("<ButtonPress-1>", self.drag_start)
        self.canvas.bind("<B1-Motion>", self.drag_move)
        self.draw()
        self.root.after(30, self.tick)

    def drag_start(self, event):
        self.drag_x, self.drag_y = event.x, event.y

    def drag_move(self, event):
        self.root.geometry("+%d+%d" % (event.x_root - self.drag_x, event.y_root - self.drag_y))

    def listen(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("127.0.0.1", 37652))
        server.listen()
        while True:
            client, _ = server.accept()
            data = b""
            while True:
                chunk = client.recv(4096)
                if not chunk:
                    break
                data += chunk
            try:
                self.events.put((json.loads(data.decode("utf-8")), client))
            except (ValueError, UnicodeDecodeError):
                client.close()

    def replace_input(self, text, previous_length):
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
        self.root.update()
        user32 = ctypes.windll.user32
        # Select the prior preview first, then replace it atomically with one paste.
        # This avoids the visible empty input state caused by repeated Backspace.
        if previous_length > 0:
            user32.keybd_event(0x10, 0, 0, 0)
            for _ in range(previous_length):
                user32.keybd_event(0x25, 0, 0, 0)
                user32.keybd_event(0x25, 0, 2, 0)
            user32.keybd_event(0x10, 0, 2, 0)
        user32.keybd_event(0x11, 0, 0, 0)
        user32.keybd_event(0x56, 0, 0, 0)
        user32.keybd_event(0x56, 0, 2, 0)
        user32.keybd_event(0x11, 0, 2, 0)

    def draw(self):
        c = self.canvas
        c.delete("all")
        bob = int(self.level * 6) + (1 if self.phase % 24 < 12 else 0)
        # Show a bubble only while a streaming ASR hypothesis is available.
        if self.text:
            c.create_polygon(20, 10, 288, 10, 298, 20, 298, 88, 288, 98, 83, 98, 66, 114, 68, 98, 20, 98, 10, 88, 10, 20, fill="#18212b", outline="#304354", width=1)
            c.create_text(30, 25, anchor="nw", width=245, text=self.text, fill="#d9e6f2", font=("Segoe UI", 10, "bold"), justify="left")
        y = 112 - bob
        scale = 7

        def pixel(x, py, color, width=1, height=1):
            c.create_rectangle(x * scale, y + py * scale, (x + width) * scale, y + (py + height) * scale, fill=color, outline="")

        dark = "#713d2e"
        orange = "#ee9654"
        light_orange = "#ffb96f"
        cream = "#fff0d1"
        pink = "#e98583"

        # Ground shadow and status spark. The spark changes color with STT state.
        c.create_oval(75, y + 126, 236, y + 143, fill="#593d35", outline="")
        c.itemconfig(c.find_all()[-1], stipple="gray25")
        pixel(38, 1, self.color, 1, 1)
        if self.level > 0.15:
            pixel(40, 0, self.color, 1, 1)
            pixel(37, 3, self.color, 1, 1)

        # Tail, body, paws: deliberately blocky and offset on a 7px pixel grid.
        for x, py, width, height in [(27, 11, 3, 1), (29, 9, 2, 2), (30, 7, 2, 2), (29, 5, 2, 2), (27, 4, 2, 1)]:
            pixel(x, py, orange, width, height)
        pixel(29, 4, dark, 1, 1)
        pixel(26, 13, dark, 2, 1)
        pixel(12, 13, orange, 14, 7)
        pixel(10, 15, orange, 2, 4)
        pixel(26, 15, orange, 2, 4)
        pixel(14, 17, cream, 10, 4)
        pixel(12, 20, light_orange, 5, 2)
        pixel(21, 20, light_orange, 5, 2)
        pixel(12, 22, dark, 4, 1)
        pixel(22, 22, dark, 4, 1)

        # Head silhouette, ears, inner ears, then face.
        pixel(9, 3, orange, 2, 2)
        pixel(25, 3, orange, 2, 2)
        pixel(8, 5, orange, 20, 9)
        pixel(10, 2, orange, 3, 3)
        pixel(23, 2, orange, 3, 3)
        pixel(11, 3, pink, 1, 1)
        pixel(24, 3, pink, 1, 1)
        pixel(8, 7, dark, 1, 5)
        pixel(27, 7, dark, 1, 5)
        pixel(10, 5, dark, 2, 1)
        pixel(15, 5, dark, 2, 1)
        pixel(20, 5, dark, 2, 1)
        pixel(25, 5, dark, 2, 1)
        pixel(12, 8, dark, 2, 2)
        pixel(22, 8, dark, 2, 2)
        pixel(13, 8, cream, 1, 1)
        pixel(23, 8, cream, 1, 1)
        pixel(15, 10, cream, 6, 3)
        pixel(17, 10, pink, 2, 1)
        pixel(18, 11, dark, 1, 1)
        pixel(16, 12, dark, 2, 1)
        pixel(19, 12, dark, 2, 1)
        pixel(10, 10, dark, 2, 1)
        pixel(24, 10, dark, 2, 1)
        pixel(9, 12, dark, 3, 1)
        pixel(24, 12, dark, 3, 1)

        # Collar is the only persistent state-colored part of the cat.
        pixel(12, 14, self.color, 12, 1)
        pixel(17, 15, self.color, 2, 1)
        pixel(18, 16, "#ffe28a", 1, 1)

        # Tiny audio bars under the collar, animated only by volume.
        for index in range(7):
            height = 1 + int(self.level * (3 if index % 2 else 4))
            pixel(13 + index * 2, 24 - height, self.color, 1, height)

    def tick(self):
        changed = False
        while not self.events.empty():
            event, client = self.events.get()
            if event.get("action") == "replace":
                try:
                    self.replace_input(event["text"], int(event.get("previousLength", 0)))
                    client.sendall(b'{"ok":true}')
                except Exception as error:
                    client.sendall(json.dumps({"error": str(error)}).encode("utf-8"))
                client.close()
                continue
            if event.get("color"):
                self.color = PALETTE.get(event["color"], event["color"])
                changed = True
            if "text" in event:
                self.text = event["text"]
                changed = True
            if "level" in event:
                self.level = float(event["level"])
                changed = True
            client.close()
        self.phase += 1
        if changed or self.phase % 10 == 0:
            self.draw()
        self.root.after(30, self.tick)


pet = Pet()
threading.Thread(target=pet.listen, daemon=True).start()
pet.root.mainloop()
