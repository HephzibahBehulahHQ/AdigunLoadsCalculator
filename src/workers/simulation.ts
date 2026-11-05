import {simulateRange} from '../engine/simulation';
self.onmessage=(e:MessageEvent)=>{try{self.postMessage({result:simulateRange(e.data.project,e.data.options)})}catch(error){self.postMessage({error:(error as Error).message})}};
