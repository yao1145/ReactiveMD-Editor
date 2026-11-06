import {appendFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const engine=fileURLToPath(import.meta.resolve('reactive-md/notices'));
appendFileSync('THIRD_PARTY_NOTICES.md','\n\n# Worker engine notices\n\n'+readFileSync(engine,'utf8'));
