const sounds = [];
let icon; 

// Add selected files to dropdown
function handleFiles(files) {
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    
    if (!file.type.startsWith('audio/')){ continue }
    
    // if sounds should be inlined, parse the file as data URL
    if (document.getElementById("inline").checked) {
      let reader = new FileReader();
      reader.onload = e => { addSoundFile(file.name, e.target.result); };
      reader.readAsDataURL(file);
    } else {
      addSoundFile(file.name);
    }
  }
}

// Add a URL to the dropdown
function addSoundFile(name, url) {
  const nameWithoutExtension = name.substr(0, name.lastIndexOf('.')) || input;

  if(!url) {
    url = `sounds/${name}`;
  }

  const sound = {
    name: nameWithoutExtension, 
    url: url,
  };
  sounds.push(sound);
  injectSoundToIframe(sound);
  console.log(sounds);
}

function onIconSelected(files) {
  if (files.length > 0) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = e => {
      icon = {
        name: file.name,
        type: file.type,
        url: e.target.result,
      };
      updateIconPreview();
      injectManifest();
    }
    reader.readAsDataURL(file);
  }
}

document.getElementById("icon").addEventListener("change", (e) => {
  onIconSelected(e.target.files);
}, false);

function updateIconPreview() {
  const iconPreview = document.getElementById("icon-preview");
  iconPreview.src = icon.url;
}

function generateManifest() {
  // base manifest (these do not change)
  const manifestJson = {
    "name": "SoundJam app",
    "start_url": "/",
    "background_color": "white",
    "display": "standalone",
    "scope": "/",
  }

  // inject app name
  const name = document.getElementById("name").value;
  if (name) {
    manifestJson.name = name;
  }

  //inject app short name
  const shortName = document.getElementById("short_name").value;
  if (shortName) {
    manifestJson.short_name = shortName;
  }

  // inject primary color
  const primary = document.getElementById("primary").value;
  if (primary) {
    manifestJson.theme_color = primary;
  }

  // inject icon
  if (icon) {
    manifestJson.icons = [
      {
        src: icon.url,
        type: icon.type,
        size: "180x180",
      }
    ];
  }

  return manifestJson;
}

function injectManifest() {
  const iframeDoc = preview.contentWindow.document;
  const manifestJson = generateManifest();
  const manifest = JSON.stringify(manifestJson);

  iframeDoc.head.querySelectorAll('link[rel="manifest"]').forEach(e => e.remove());

  // inject manifest inline in iframe 
  const manifestLink = iframeDoc.createElement('link');
  manifestLink.setAttribute('rel', 'manifest');
  manifestLink.setAttribute('href', `data:application/manifest+json;charset=utf-8,${encodeURIComponent(manifest)}`);
  iframeDoc.head.appendChild(manifestLink);

}

document.getElementById("name").addEventListener("change", injectManifest);
document.getElementById("short_name").addEventListener("change", injectManifest);
document.getElementById("primary").addEventListener("change", injectManifest);

function injectPrimaryColor() {
  const primary = document.getElementById("primary").value;
  
  if (primary) {
    const iframeDoc = preview.contentWindow.document;

    // remove any previously set tags
    iframeDoc.head.querySelectorAll('meta[name="theme-color"]').forEach(e => e.remove());
    iframeDoc.head.querySelectorAll('style#primary').forEach(e => e.remove());

    const meta = iframeDoc.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', primary);
    iframeDoc.head.appendChild(meta);

    const style = iframeDoc.createElement('style');
    style.id = 'primary';
    style.textContent = `
      body {
        --primary: ${primary};
      }
      `;
    iframeDoc.head.appendChild(style);
  }
}

document.getElementById("primary").addEventListener("change", injectPrimaryColor);

function injectSoundToIframe(sound) {
  // also inject manifest and primary color
  injectPrimaryColor();
  injectManifest();

  const iframeDoc = preview.contentWindow.document;
   const button = iframeDoc.createElement('button');
  button.innerText = sound.name;
  button.onclick = function() {
    this.nextElementSibling.play();
  };
  const audio = iframeDoc.createElement('audio');
  audio.src = sound.url;

  iframeDoc.querySelector("main").appendChild(button);
  iframeDoc.querySelector("main").appendChild(audio);
  iframeDoc.querySelector("main").appendChild(document.createTextNode("\n    "));
}

document.getElementById("sounds-input").addEventListener("change", (e) => {
  handleFiles(e.target.files);
}, false);

// Drag and drop
const dropzone = document.getElementById("dropbox");
dropzone.ondragover = dropzone.ondragenter = (e) => {
  e.stopPropagation();
  e.preventDefault();
}
dropzone.ondrop = (e) => {
  e.stopPropagation();
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
}

const button = document.getElementById("download");
button.addEventListener('click', () => {
  const iframeDoc = preview.contentWindow.document;
  const htmlToDownload = iframeDoc.documentElement.outerHTML;
  
  // Trick to download a file
  const a = window.document.createElement('a');
  a.href = window.URL.createObjectURL(new Blob([htmlToDownload], {type: 'text/html'}));
  a.download = 'index.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});