// import mermaid 
const mermaid = require('mermaid');

//upon clicking upload file, request the file from the main process
var uploadFile = document.getElementById('upload-file');

// if uploadFile is not null, add an event listener to it
if (uploadFile) {
  uploadFile.addEventListener('click', () => {
    ipcRenderer.send('file-request');
  });
}

ipcRenderer.on('file', (event, data) => {
  const fileDataContainer = document.getElementById('file-data');
  fileDataContainer.className = "mb-4 mt-3 w-75 bg-white text-dark border";
  fileDataContainer.innerHTML = "<pre><code>"+JSON.stringify(data, null, 2)+"</code></pre>"
  // hide file-data div
  fileDataContainer.style.display = 'none';

  document.getElementById('confirm-data').style.display = 'block';

  // show diagram div
  const diagramContainer = document.getElementById('diagram');
  diagramContainer.style.display = 'block';
  // add mermaid diagram to the page
  createMermaidGraph(data);
  // make #confirm-data visible
});

ipcRenderer.on('download', (event, data) => {
  ipcRenderer.send('download', data);
});

ipcRenderer.on('redirect', (event, url) => {
  window.location.href = url;
});

ipcRenderer.on('import-status', (event, status) => {
  document.getElementById('import-status').innerHTML = status;
});

ipcRenderer.on('export-status', (event, status) => {
  document.getElementById('export-status').innerHTML = status;
});

ipcRenderer.on('import-error', (event, error) => {
  document.getElementById('error-alert').style.display = 'block';
  document.getElementById('import-error').innerHTML = error;
});

// make createMermaidGraph function in js
function createMermaidGraph(data) {
  
  mermaid_graph = jsonToMermaid(data);

  console.log(mermaid_graph);

  const output = document.getElementById('mermaid');
  document.getElementById('mermaid').innerHTML = mermaid_graph;
  let insert = function (mermaid_graph) {
    output.innerHTML = mermaid_graph;
  }
  // render the mermaid graph
  mermaid.render("prepared_scheme", mermaid_graph, insert)

}

function jsonToMermaid(json) {
  let mermaid = "flowchart LR\n";
  let orgs = json.orgs;
  let sla = json.sla;

  // Add org nodes
  for (let org of orgs) {
    mermaid += `    ${org.code}["${org.name.replace(/ /g, "_")}"]\n`;
  }

  // Add service nodes
  for (let org of orgs) {
    if (!org.services) {
      continue;
    }
    for (let service of org.services) {
      let providers = service.providers;
      let teams = service.teams;
      if(providers){
        let providerNames = providers.map((p) => p.provider);
      }

      mermaid += `        ${org.code} --- ${service.name.replace(/ /g, "_")}(["${service.name.replace(/ /g, "_")}"])\n`;

      // Add provider links
      if (providers) {
        for (let provider of providers) {
          let cardinality = provider.cardinality || "1";
          let sla = provider.sla || "SLA";
          // mermaid += `            ${provider.service.replace(/ /g, "_")} --> |${cardinality}| ${service.name.replace(/ /g, "_")}\n`;
          mermaid += `            ${provider.service.replace(/ /g, "_")} === ${sla} ==> |${cardinality}| ${service.name.replace(/ /g, "_")}\n`;
        }
      }

      // Add teams
      if (teams) {
        for (let team of teams) {
          mermaid += `            ${service.name.replace(/ /g, "_")} -.- ${team.name.replace(/ /g, "_")}\n`;
        }
      }

      // Add SLA links
      for (let customer of service.customers) {
        let slaName = customer.sla;

        mermaid += `            ${service.name.replace(/ /g, "_")} === ${slaName.replace(/ /g, "_")} ==>`;
        mermaid += ` ${customer.name.replace(/ /g, "_")}\n`;
      }
      mermaid += "\n";
    }
  }

  // Add SLA nodes
  for (let s of sla) {
    let name = s.name;
    let ttrMax = s.guarantees.ttr.max;
    let ttrLabel = `TTR < ${ttrMax.value}${ttrMax.unit}`;
    let ttoMax = s.guarantees.tto.max;
    let ttoLabel = `TTO < ${ttoMax.value}${ttoMax.unit}`;
    mermaid += `    ${name.replace(/ /g, "_")}{${ttrLabel}\\n${ttoLabel}}\n`;
  }

  // Add Team nodes
  for (let org of orgs) {
    if (!org.teams) {
      continue;
    }
    for (let team of org.teams) {
      members = "";
      for (let member of team.members) {
        members += `${member.name} - ${member.email}\n`;
      }
      mermaid += `    ${team.name.replace(/ /g, "_")}{{"${members}"}}\n`;
      mermaid += `    style ${team.name.replace(/ /g, "_")} fill:#FFFFCC,stroke:#FFFFCC,stroke-width:2px\n`;
    }
  }

  return mermaid;
}

  
  
