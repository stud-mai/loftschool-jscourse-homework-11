let fs = require('fs');

function makeDirsFirst(source, path){
	return source.sort((dir, file) => {
		let statD = fs.statSync(`${path}/${dir}`),
			statF = fs.statSync(`${path}/${file}`);
		if (!statD.isFile() && statF.isFile()) return -1
		else if (statD.isFile() && !statF.isFile()) return 1
	})
}
	
function createJSON(dirs,path){
    let sum = 0,
		items = [],
		stat;
    for (let i = 0, len = dirs.length; i < len; i++){
        let fullPath = `${path}/${dirs[i]}`,
			dirContent = {};			
        stat = fs.statSync(fullPath);
        if (!stat.isFile()) {			
			dirContent.name = dirs[i];
			dirContent.type = 'dir';
			dirContent.size = 0;
			dirContent.items = [];
            [dirContent.items, dirContent.size] = createJSON(fs.readdirSync(fullPath), fullPath);
			sum += dirContent.size;
        }
        else {
            let fsize = Math.ceil(stat['size'] / 1024);
            sum += fsize;
			dirContent.name = dirs[i];
			dirContent.type = 'file';
			dirContent.size = fsize;	
        }
		items.push(dirContent);
    }
    return [items, sum];
}

function printJSON(source){
	let tab = '   ',
		tree = '|--';
	console.log(`${tab.repeat(depth)}${(depth > 0)? tree : ''}${source.name} (${source.size} kb)`);
	if (source.items) {
		depth++;
		for (let item of source.items){			
			printJSON(item)
		}
		depth--;
	}
}

module.exports = function(path) {    
	try {
		let items = fs.readdirSync(path),
			sortedItems = makeDirsFirst(items,path),
			json = createJSON(sortedItems,path),
			result = {
				name: path,
				type: 'dir',
				size: json[1],
				items: json[0]
			},
			depth = 0;
		printJSON(result);
    } catch (err) {
        console.error(err);
    }
};
