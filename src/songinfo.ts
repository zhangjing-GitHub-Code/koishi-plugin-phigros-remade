import * as fs from 'node:fs';
import * as ut from './utils';
import * as path from 'node:path';
import { Logger } from 'koishi';

export interface dstChartInfo{
	level: number
	difficulty: number
	combo: number
	charter: string
}
export interface decrSongInfo{
	songName:string
	songId:string
	songKey:string
	songTitle:string
	difficulty: Array<number>
	composer:string
	charter: Array<string>
}
export interface moeghSongInfo{
	song: string
	composer: string
	chart: { [key: string]: dstChartInfo }
//Map<string,dstChartInfo>
		/*{
		EZ?: dstChartInfo
		HD?: dstChartInfo
		IN?: dstChartInfo
		AT?: dstChartInfo
	}*/
	illustration: string
	illustration_big: string
	illustrator:string
}
export interface dstSongInfo{
	id: string
	name: string
	artist: string
	chart:{ [key: string]: dstChartInfo }
// Map<string,dstChartInfo>
		/*{
		EZ?: dstChartInfo
		HD?: dstChartInfo
		IN?: dstChartInfo
		AT?:dstChartInfo
	}*/
	illustration: string
	thumbnail: string
	illustrator:string
}
const idx2lvl=["EZ","HD","IN","AT"];
let logr=new Logger("phigros-rmk");

// const args=process.argv.splice(2);
// const filesrc=args[0],filedst=args[1];
// console.log(filesrc,filedst);
// console.log(args.splice(2));
// const usage_s="Usage: node index.js <src .json> <dst .json>"
/*if(!filedst||!filesrc){
	console.log(usage_s);
	process.exit(1);
}*/
const gh_srcs=[
	"https://mirror.ghproxy.com/raw.github.com",
	"https://raw.kkgithub.com",
	"https://raw.github.com"
]
export async function getSongInfo(){
	// const b_dir=ut.getBaseDir();
	const rpath=path.join(
		ut.getBaseDir(),
		"data/phigros"
	);
	ut.checkCreateDir(rpath);
	const obj_src:Map<string,moeghSongInfo>=await ut.DLnCacheFile("https://ssmzhn.github.io/Phigros/Phigros.json",rpath);
	let awithid:Array<decrSongInfo>;
	for(let pi of gh_srcs){
		const rurl=pi+"/SonolusHaniwa/phigros-decrypted-data/main/metadata.json"
		try{
			logr.info("Dl",rurl);
			awithid=(await ut.DLnCacheFile(rurl,rpath,false)) as Array<decrSongInfo>;
			break;
		}catch(e:any){}
	}
	if(!awithid){
		logr.error(`Failed to get gh data from 3 src, check your very rare network!`);
	}
	// ut.validateJSONFile(filedst,"dst JSON",true);
	let arr_res:Array<dstSongInfo>=[];
	//let obj_srm={} as Map<string,decrSongInfo>;
	//let cc=0;
	/*awithid.forEach((si:decrSongInfo)=>{
		obj_srm.set(si.songName,si);
	});*/
	for(let vi of Object.values(obj_src)){
		let si:moeghSongInfo=vi;
		// let si=obj_src.get(ki) as moeghSongInfo;
		// console.log(si);
		//++cc;
		//if(cc>5)return;
		///*
		let t={} as dstSongInfo;
		// t.id=ut.generateSongID(si.song,si.composer);// si.id;
		// await console.log("si is",si);
		// await new Promise(resolve=>setTimeout(resolve, 1000));
		// continue;
		//await new Promise((rsv)=>{setTimeout(()=>rsv(),1000);})
		const fn=await ut.filterName(si.song);
		const fn_nosfx=si.song.replace(/(from)|(\().*/g,'');
		// 0th, full-compare
		// 1st, filter sp cahrs
		// 2nd, filter from and (.*
		// 3rd (final choice) trunc 1st space
		let dd=awithid.find((u)=>{
			if(si.song==u.songName)return true;
			return false;
		});
		if(!dd)dd=awithid.find((u)=>{
			const un=ut.filterName(u.songName);
			if(un===fn)return true;
			return false;
		});
		if(!dd)dd=awithid.find((u)=>{
			if( fn_nosfx===u.songName.replace(/(from)|(\().*/g,'') &&
				si.composer===u.composer)return true;
			return false;
		});
		if(!dd)dd=awithid.find((u)=>{
			if(si.song.replace(/ .*/g,'')
	===u.songName.replace(/ .*/g,'') &&
				si.composer===u.composer)return true;
			return false;
		});
		if(!dd){
			t.id=ut.generateSongID(si.song,si.composer);
			console.log("not found:",si.song," using generated",t.id);
			// continue;
		}else t.id=dd.songId;
		t.artist=si.composer;
		t.name=si.song;
		t.chart=si.chart;// {} as any;
		t.thumbnail=si.illustration;
		t.illustration=si.illustration_big;
		/*for(let ci=0;ci<si.charter.length;++ci){
			let tc={} as dstChartInfo;
			tc.difficulty=si.difficulty[ci];
			tc.level=Math.floor(tc.difficulty);
			tc.charter=si.charter[ci];
			t.chart[idx2lvl[ci]]=tc;
		}*/
		arr_res.push(t);//*/
	}
	// console.log(arr_res);
	return arr_res;
}
