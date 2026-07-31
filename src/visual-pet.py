import json
import queue
import socket
import threading
import tkinter as tk


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
        self.text = "READY\nHold F8 to speak"
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
            client.close()
            try:
                self.events.put(json.loads(data.decode("utf-8")))
            except (ValueError, UnicodeDecodeError):
                pass

    def draw(self):
        c = self.canvas
        c.delete("all")
        bob = int(self.level * 5) + (1 if self.phase % 20 < 10 else 0)
        # Speech bubble
        c.create_polygon(20, 12, 288, 12, 298, 22, 298, 92, 288, 102, 83, 102, 66, 118, 68, 102, 20, 102, 10, 92, 10, 22, fill="#18212b", outline="#304354", width=1)
        c.create_text(30, 27, anchor="nw", width=245, text=self.text, fill="#d9e6f2", font=("Segoe UI", 11, "bold"), justify="left")
        # Pet body
        y = 158 - bob
        c.create_oval(72, y - 44, 238, y + 104, fill="#1a2733", outline=self.color, width=3)
        c.create_oval(85, y - 30, 225, y + 91, fill="#202f3c", outline="")
        # Ears
        c.create_polygon(91, y - 14, 110, y - 67, 135, y - 28, fill="#1a2733", outline=self.color, width=2)
        c.create_polygon(181, y - 28, 205, y - 67, 222, y - 13, fill="#1a2733", outline=self.color, width=2)
        # Eyes
        eye = 5 + int(self.level * 5)
        c.create_oval(118 - eye, y + 6 - eye, 118 + eye, y + 6 + eye, fill=self.color, outline="")
        c.create_oval(190 - eye, y + 6 - eye, 190 + eye, y + 6 + eye, fill=self.color, outline="")
        # Mouth and signal bars
        c.create_arc(142, y + 20, 166, y + 42, start=200, extent=140, style="arc", outline="#9bb4cd", width=2)
        for i in range(9):
            height = 4 + int(self.level * (12 if i % 2 else 18))
            x = 110 + i * 12
            c.create_line(x, y + 75 - height, x, y + 75 + height, fill=self.color, width=3)
        c.create_text(155, y + 122, text="LOCAL · PRIVATE · READY", fill="#71869b", font=("Segoe UI", 8, "bold"))

    def tick(self):
        changed = False
        while not self.events.empty():
            event = self.events.get()
            if event.get("text"):
                self.text = event["text"]
                changed = True
            if event.get("color"):
                self.color = PALETTE.get(event["color"], event["color"])
                changed = True
            if "level" in event:
                self.level = float(event["level"])
                changed = True
        self.phase += 1
        if changed or self.phase % 10 == 0:
            self.draw()
        self.root.after(30, self.tick)


pet = Pet()
threading.Thread(target=pet.listen, daemon=True).start()
pet.root.mainloop()
