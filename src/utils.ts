// const fs = require('fs');
import * as fs from 'node:fs';
const path = require('path');
import { Context,Logger } from 'koishi';

let kctx:Context;
export let u_lgr=new Logger("phigros-rmk");

export function dedupe<T = any>(arr: T[], primary?: (item: T) => any): T[] {
  if (!primary) return Array.from(new Set(arr))
  const map = new Map(arr.map(i => [primary(i), i]))
  return Array.from(map.values())
}

const rgx_sn=/[^a-zA-Z0-9\p{sc=Han}\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]|[\u2600-\u26ff（）]/gu;
const rgx_cps=rgx_sn;
// const rgx_cps=/[^a-zA-Z0-9\p{sc=Han}\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\p{So}\p{Sc}\p{Sk}]/gu;
//const rgx_cps=/[\(\)\. ]/gu;

export function loadKCtx(ctx:Context){ kctx=ctx; }

export async function fileExists(filePath:string) {
        try{ return await fs.promises.access(filePath); }
	catch(e:any){ return false; }
}
export async function checkCreateDir(path:string){
	let res;
	try{
		res=await fs.promises.mkdir(path,{recursive:true});
	}catch(e:any){
		u_lgr.error(`create Dir ${path} Failed! Check its perm.`);
		kctx.scope.dispose();
	}
	try{
		await fs.promises.access(path);}catch(e:any){
		u_lgr.error(`Path ${path} lacks permission!`);
		kctx.scope.dispose();
	}
}
export function validateJSONFile(path:string,hintname:string,isCheckNew:boolean=false){
		if(!path.endsWith(".json")){
			console.log(`${hintname} is not a json!`);
			process.exit(1);
		}
	if(isCheckNew){
		// if(!fs.accessSync(path))
		return;
	}
		if(!fileExists(path)){
			console.log(`${hintname} does not exist!`);
			process.exit(1);
		}
	try{
		let fo=fs.readFileSync(path);
		console.log(fo.toString().slice(0,20));
		let obj=JSON.parse(fo.toString());
		return obj;
	}catch(e){
		console.log(`Not a file, Permission denied or formst error\nPlease check ${hintname}`);
		process.exit(1);
	}
}
export function rmfrom(srx:string,rgx: RegExp){
	return srx.replaceAll(rgx,'');
}
export function generateSongID(name:string,compsr:string){
	return rmfrom(name,rgx_sn)
	+	'.'
	+	rmfrom(compsr,rgx_cps);
}
export function filterName(src:string){
	return src.replaceAll(rgx_sn,'');
}
export function getBaseDir(){
	return kctx.baseDir;
}
// };
const mxtry=3;
// Check of dir should be passed before
export async function DLnCacheFile(url:string,storageDir:string,doDispose=true){
	const fp=await path.join(storageDir,path.basename(url));
	let buf;
	let p_ex=fileExists(fp);
	for(let i=1;i<=mxtry;++i){
		try{ buf=await kctx.http.get(url); break }
		catch(e:any){
			if(i==mxtry){
				u_lgr.error(`Download of ...${url.slice(-10)} failed for ${mxtry} times!`);
				if(await p_ex){
					u_lgr.warn("Falling back to File");
					return JSON.parse((await fs.promises.readFile(fp)).toString());
				}
				if(doDispose)kctx.scope.dispose();
				throw new Error("DL Suck");
			}
		}
	}
	// console.log("BUFFER:",buf);
	let jstr;
	if((typeof buf)==='string')jstr=buf;
	else if((typeof buf)==='object'||(typeof buf)==='symbol')jstr=JSON.stringify(buf);
	// console.log(jstr);
	if(!(await p_ex)){
		await fs.promises.writeFile(fp,jstr);
	}else{
	// Exists
		const rd=(await fs.promises.readFile(fp)).toString();
		if(!(rd===jstr)){
			await fs.promises.writeFile(fp,jstr);
		}
	}
	try{ return JSON.parse(jstr); }
	catch(e:any){ return jstr; }
}
