const html = htm.bind(React.createElement);

function hexToArrayBuffer(hex) {
  return new Uint8Array(
    hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16);
    })
  ).buffer;
}

function arrayBufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  for (let byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  let binary = window.atob(base64);
  let bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function runDecode(mode, data) {
  return new Promise((resolve, reject) => {
    const module = {
      arguments: [mode, "input.bit", "output.raw"],
      preRun: () => {
        module.FS.writeFile("input.bit", new Uint8Array(data));
      },
      postRun: () => {
        let buffer = module.FS.readFile("output.raw", {
          encoding: "binary",
        });
        resolve(buffer);
      },
    };
    createC2Dec(module);
  });
}

function runEncode(mode, data) {
  return new Promise((resolve, reject) => {
    const module = {
      arguments: [mode, "input.raw", "output.bit"],
      preRun: () => {
        module.FS.writeFile("input.raw", new Uint8Array(data));
      },
      postRun: () => {
        let buffer = module.FS.readFile("output.bit", {
          encoding: "binary",
        });
        resolve(buffer);
      },
    };
    createC2Enc(module);
  });
}

function rawToWav(buffer) {
  return new Promise((resolve, reject) => {
    const module = {
      arguments: [
        "-r",
        "8000",
        "-L",
        "-e",
        "signed-integer",
        "-b",
        "16",
        "-c",
        "1",
        "input.raw",
        "output.wav",
      ],
      preRun: () => {
        module.FS.writeFile("input.raw", new Uint8Array(buffer));
      },
      postRun: () => {
        let output = module.FS.readFile("output.wav", {
          encoding: "binary",
        });
        resolve(output);
      },
    };
    SOXModule(module);
  });
}

function audioFileToRaw(buffer, filename) {
  return new Promise((resolve, reject) => {
    const module = {
      arguments: [
        filename,
        "-r",
        "8000",
        "-L",
        "-e",
        "signed-integer",
        "-b",
        "16",
        "-c",
        "1",
        "output.raw",
      ],
      preRun: () => {
        module.FS.writeFile(filename, new Uint8Array(buffer));
      },
      postRun: () => {
        let output = module.FS.readFile("output.raw", {
          encoding: "binary",
        });
        resolve(output);
      },
    };
    SOXModule(module);
  });
}

const DEFAULT_VALUE =
  "dOmBUOGFQjDhwIHwchQBIHIJQWDhxUHwRintQFH78RDBYKkwwUnpUAQ/fZDFj32wTl69oH4jOXBExliwK4pgwC3OYNBActjAGL8o8JCS8QCxpIAQN+oAgIS73AB4kKAQowK9gBYbdUBwXoQQkFaEAFl/gRCmrRSg4bBAAOHHQRBGKekwRlClEMPagMA6TMDQK9T1QC2zrTBtroVA/KhBAAG5QNDN99gA2QggALnlcWAlWr1QLxl9MIQ++RAf9+AA3YWkAF8fAADI3ohgmoLAANyGAAB7IxigjFVc4IwN1JCMDdBAa63QEHhdjABfKRAAu0ncALteGABIdcAAq/kBIOH/gSCT9gIQcj9BkOHDgADhsMFw4fEC0PrXQSByGoFw7qnCQKu3gYDh/4MQ";

function ModeSelector(props) {
  return html`<div style=${{ marginTop: "20px" }} className="form-group row">
    <label htmlFor="decode-mode-select" className="col-sm-3 col-form-label"
      >Codec Mode</label
    >
    <div className="col-sm-9">
      <select defaultValue="700C" id=${props.selectId} className="form-control">
        <option value="3200">3200</option>
        <option value="2400">2400</option>
        <option value="1600">1600</option>
        <option value="1400">1400</option>
        <option value="1300">1300</option>
        <option value="1200">1200</option>
        <option value="700C">700C</option>
        <option value="450">450</option>
        <option value="450PWB">450PWB</option>
      </select>
    </div>
  </div>`;
}

class Decoder extends React.Component {
  render() {
    return html`<div>
      <div className="form-group">
        <label htmlFor="decode-input">Base64 Input</label>
        <textarea
          className="form-control"
          style=${{ width: "100%", height: "300px" }}
          defaultValue=${DEFAULT_VALUE}
          id="decode-input"
        >
        </textarea>
      </div>

      <${ModeSelector} selectId="decode-mode-select" />

      <div
        style=${{
          marginTop: "20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "right",
        }}
      >
        <button
          type="submit"
          className="btn btn-primary"
          onClick=${() => this.decode()}
        >
          Decode
        </button>
      </div>
      <hr />
      <div style=${{ marginTop: "20px" }}>
        <audio style=${{ width: "100%" }} id="decode-playback" controls></audio>
      </div>
    </div>`;
  }

  async decode() {
    const mode = document.getElementById("decode-mode-select").value;

    const input = document.getElementById("decode-input").value;
    const encoded = base64ToArrayBuffer(input);

    let decodedRaw = await runDecode(mode, encoded);
    let decodedWav = await rawToWav(decodedRaw);

    document.getElementById("decode-playback").src = URL.createObjectURL(
      new Blob([decodedWav], { type: "audio/wav" })
    );
  }
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(file);
  });
}

class Encoder extends React.Component {
  render() {
    return html`<div>
      <div className="form-group row">
        <div className="col-sm-4">
          <label htmlFor="enc-upload">.WAV File Upload</label>
        </div>
        <div className="col-sm-8">
          <input
            id="enc-upload"
            className="form-control-file"
            type="file"
            accept="audio/wav"
          />
        </div>
      </div>

      <${ModeSelector} selectId="encode-mode-select" />

      <div
        style=${{
          marginTop: "20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "right",
        }}
      >
        <button
          type="submit"
          className="btn btn-primary"
          onClick=${() => this.encode()}
        >
          Encode
        </button>
      </div>

      <hr />

      <div className="form-group">
        <textarea
          className="form-control"
          style=${{ width: "100%", height: "300px", marginTop: "20px" }}
          id="encode-output"
        >
        </textarea>
      </div>
    </div>`;
  }

  async encode() {
    let file = document.getElementById("enc-upload").files[0];
    const mode = document.getElementById("encode-mode-select").value;

    let buffer = await readFileAsArrayBuffer(file);
    let rawBuffer = await audioFileToRaw(buffer, file.name || "input.wav");
    let encoded = await runEncode(mode, rawBuffer);

    document.getElementById("encode-output").innerHTML =
      arrayBufferToBase64(encoded);
  }
}

ReactDOM.createRoot(document.getElementById("dec-root")).render(
  React.createElement(Decoder)
);

ReactDOM.createRoot(document.getElementById("enc-root")).render(
  React.createElement(Encoder)
);
