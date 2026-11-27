#!/usr/bin/env python3
"""Servidor local de desarrollo. Solo biblioteca estandar; no es para produccion."""
import argparse
import errno
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser


def main():
    parser = argparse.ArgumentParser(description="Abrir Ernesto Investing AI en tu navegador.")
    parser.add_argument("--port", type=int, default=8000, help="Puerto inicial (8000 por defecto).")
    parser.add_argument("--no-browser", action="store_true", help="No abrir el navegador automaticamente.")
    args = parser.parse_args()
    if not 1024 <= args.port <= 65525:
        parser.error("Usa un puerto entre 1024 y 65525.")
    root = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    server = None
    for port in range(args.port, args.port + 11):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), handler)
            break
        except OSError as exc:
            if exc.errno not in (errno.EADDRINUSE, 10048):
                raise
    if server is None:
        parser.exit(1, "No hay un puerto libre. Prueba: python iniciar.py --port 9000\n")
    url = "http://127.0.0.1:{}/".format(server.server_port)
    print("\nERNESTO INVESTING AI | Simulacion academica", flush=True)
    print("Abre: " + url, flush=True)
    print("Deja esta ventana abierta. Ctrl+C para detener.\n", flush=True)
    timer = None
    if not args.no_browser:
        timer = Timer(0.6, lambda: webbrowser.open(url))
        timer.daemon = True
        timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.", flush=True)
    finally:
        if timer:
            timer.cancel()
        server.server_close()


if __name__ == "__main__":
    main()
