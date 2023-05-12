// Import stylesheets
import './style.css';
import Viewer from './Viewer';
import Viewer2 from './Viewer2';

// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById('app');
appDiv.innerHTML = `
<h1>TypeScript Starter</h1>
<button data-action="switch-view">Switch View</button>
`;

let viewer: Viewer | Viewer2 = new Viewer();
appDiv.querySelectorAll('button').forEach((button) => {
  switch (button.dataset.action) {
    case 'switch-view':
      button.onclick = () => {
        const isViewer = viewer instanceof Viewer;
        viewer.dispose();
        if (isViewer) {
          viewer = new Viewer2();
        } else {
          viewer = new Viewer();
        }
      };
      break;
  }
});
