let fs = require('fs');

let tab = '   ',
    tree = '|--',
    data = [],
    depth = 0,
    stat;

function getDirSize(dirs,path){
    let sum = 0;
    for (let i = 0, len = dirs.length; i < len; i++){
        dirs[i] = `${path}/${dirs[i]}`;
        stat = fs.statSync(dirs[i]);
        if (!stat.isFile()) {
            let subdir = fs.readdirSync(dirs[i]);
            depth++;
            sum += getDirSize(subdir, dirs[i],depth);
        }
        else {
            sum += Math.ceil(stat['size'] / 1024);
        }
        if (i === len - 1) {
            data.push({depth: depth, name: path, size: sum});
            depth--;
        }
    }
    return sum;
}

function liftupDirs(source, path){
    return source.sort((dir, file) => {
        let statD = fs.statSync(`${path}/${dir}`),
            statF = fs.statSync(`${path}/${file}`);
        if (!statD.isFile() && statF.isFile()) return -1
        else if (statD.isFile() && !statF.isFile()) return 1
    })
}

function lookupInside(dirs, path){
    if (depth === 0) console.log(`${path} (${data[data.length - 1].size} kb)`);
    for (let i = 0, len = dirs.length; i < len; i++){
        dirs[i] = `${path}/${dirs[i]}`;
        stat = fs.statSync(dirs[i]);
        if (!stat.isFile()) {
            let subdir = fs.readdirSync(dirs[i]),
                size = data.filter((obj) => {
                    return (obj.name == dirs[i] && obj.depth == depth + 1)
                })[0];
            console.log(`${tab.repeat(depth)}${tree}${dirs[i].substring(dirs[i].lastIndexOf('/') + 1)} (${size.size} kb)`);
            depth++;
            lookupInside(liftupDirs(subdir, dirs[i]), dirs[i]);
        }
        else {
            console.log(`${tab.repeat(depth)}${tree}${dirs[i].substring(dirs[i].lastIndexOf('/') + 1)} (${Math.ceil(stat['size'] / 1024)} kb)`);
        }
        if (i === len - 1) depth--;
    }
}

module.exports = function(path) {
    try {
        getDirSize(fs.readdirSync(path), path);
        depth = 0;
        lookupInside(liftupDirs(fs.readdirSync(path), path), path);
    } catch (err) {
        console.error(err);
    }
};

