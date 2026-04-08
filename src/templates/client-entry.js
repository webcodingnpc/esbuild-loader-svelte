import '{{GLOBAL_SCSS}}'
import { hydrate } from 'svelte'
import App from '{{VIEW_PATH}}'

const app = hydrate(App, {
    target: document.getElementById('app'),
})

export default app
