import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const settings = {
    enableBrowserDebugging : true 
}

export default settings;