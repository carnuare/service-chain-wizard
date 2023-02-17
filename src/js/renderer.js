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
  // make file-data div background white with black text and border visible in the bootstrap class
  fileDataContainer.className = "mb-4 mt-3 w-75 bg-white text-dark border";
  fileDataContainer.innerHTML = "<pre><code>"+JSON.stringify(data, null, 2)+"</code></pre>"

  // add mermaid diagram to the page
  createMermaidGraph(data);
  // make #confirm-data visible
  document.getElementById('confirm-data').style.display = 'block';
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
  const graph = [];
  const org_nodes = [];
  const service_nodes = [];
  const team_nodes = [];
  const user_nodes = [];
  const sla_nodes = [];

  for (let org of data['orgs']) {
    const org_node = `${org['code']}["${org['name']}"]`;
    org_nodes.push(org_node);

    if ('services' in org) {
      for (let service of org['services']) {
        const service_node = `${service['name'].replace(' ', '')}["${service['name']}"]`;
        service_nodes.push(service_node);

        if ('customers' in service) {
          for (let customer of service['customers']) {
            const customer_node = `${customer['name'].replace(' ', '')}["${customer['name']}"]`;
            if (!org_nodes.includes(customer_node)) {
              org_nodes.push(customer_node);
            }

            if ('sla' in customer) {
              const sla_node = `${customer['sla'].replace(' ', '')}["${customer['sla']}"]`;
              if (!sla_nodes.includes(sla_node)) {
                sla_nodes.push(sla_node);
              }

              graph.push(`${service_node} -- Monitors --> ${sla_node}`);
              graph.push(`${sla_node} -- Measures --> TTR${customer['sla'].replace(' ', '')}["TTR\\nMax: ${customer['sla_max_ttr']} ${customer['sla_unit']}"]`);
              graph.push(`${sla_node} -- Measures --> TTO${customer['sla'].replace(' ', '')}["TTO\\nMax: ${customer['sla_max_tto']} ${customer['sla_unit']}"]`);
            }
          }
        }
      }
    }

    if ('teams' in org) {
      for (let team of org['teams']) {
        const team_node = `${team['name'].replace(' ', '')}["${team['name']}"]`;
        team_nodes.push(team_node);

        for (let team_service of team['team_services']) {
          const service_node = `${team_service['name'].replace(' ', '')}["${team_service['name']}"]`;
          if (!service_nodes.includes(service_node)) {
            service_nodes.push(service_node);
          }

          graph.push(`${org_node} -- Provides --> ${team_node}`);
          graph.push(`${team_node} -- Provides --> ${service_node}`);
        }

        if ('members' in team) {
          for (let member of team['members']) {
            const user_node = `${member['name'].replace(' ', '')}["${member['name']}"]`;
            user_nodes.push(user_node);

            graph.push(`${team_node} -- Provides --> ${user_node}`);
          }
        }
      }
    }
  }

  graph.push(...org_nodes);
  graph.push(...service_nodes);
  graph.push(...team_nodes);
  graph.push(...user_nodes);
  graph.push(...sla_nodes);

  // put "flowchart LR\n" + graph.join("\n"); into mermaid div
  const mermaid_graph = "flowchart LR\n" + graph.join("\n");
  const output = document.getElementById('mermaid');
  // document.getElementById('mermaid').innerHTML = mermaid_graph;
  let insert = function (mermaid_graph) {
    output.innerHTML = mermaid_graph;
  }

  // render the mermaid graph
  mermaid.render("prepared_scheme", mermaid_graph, insert)
}
