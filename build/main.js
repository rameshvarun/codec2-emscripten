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

const DEFAULT_VALUE = `74e98150e1854230e1c081f07214012072094160e1c541f04629ed4051fb
f110c160a930c149e950043f7d90c58f7db04e5ebda07e23397044c658b0
2b8a60c02dce60d04072d8c018bf28f09092f100b1a4801037ea008084bb
dc007890a010a302bd80161b7540705e841090568400597f8110a6ad14a0
e1b04000e1c741104629e9304650a510c3da80c03a4cc0d02bd4f5402db3
ad306dae8540fca8410001b940d0cdf7d800d9082000b9e57160255abd50
2f197d30843ef9101ff7e000dd85a4005f1f0000c8de88609a82c000dc86
00007b2318a08c555ce08c0dd4908c0dd0406badd010785d8c005f291000
bb49dc00bb5e18004875c000abf90120e1ff812093f60210723f4190e1c3
8000e1b0c170e1f102d0fad74120721a8170eea9c240abb78180e1ff8310`;

class Decoder extends React.Component {
  render() {
    return html`<div>
      <div>
        <textarea
          style=${{ width: "100%", height: "300px" }}
          defaultValue=${DEFAULT_VALUE}
          id="decode-hex-input"
        >
        </textarea>
      </div>
      <select defaultValue="700C" id="decode-mode-select">
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

      <button onClick=${() => this.decode()}>Decode</button>

      <div><audio id="decode-playback" controls></audio></div>
    </div>`;
  }

  async decode() {
    const hex = document.getElementById("decode-hex-input").value;
    const buffer = hexToArrayBuffer(hex);
    const mode = document.getElementById("decode-mode-select").value;

    let decodedRaw = await runDecode(mode, buffer);
    let wavBuffer = await rawToWav(decodedRaw);

    document.getElementById("decode-playback").src = URL.createObjectURL(
      new Blob([wavBuffer], { type: "audio/wav" })
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
      <div><input id="enc-upload" type="file" /></div>
      <select defaultValue="700C" id="encode-mode-select">
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

      <div><button onClick=${() => this.encode()}>Encode</button></div>
      <textarea
        style=${{ width: "100%", height: "300px" }}
        id="encode-hex-output"
      >
      </textarea>
    </div>`;
  }

  async encode() {
    let file = document.getElementById("enc-upload").files[0];
    const mode = document.getElementById("encode-mode-select").value;

    let buffer = await readFileAsArrayBuffer(file);
    let rawBuffer = await audioFileToRaw(buffer, file.name || "input.wav");
    let encoded = await runEncode(mode, rawBuffer);

    document.getElementById("encode-hex-output").innerHTML =
      arrayBufferToHex(encoded);
  }
}

ReactDOM.createRoot(document.getElementById("dec-root")).render(
  React.createElement(Decoder)
);

ReactDOM.createRoot(document.getElementById("enc-root")).render(
  React.createElement(Encoder)
);
