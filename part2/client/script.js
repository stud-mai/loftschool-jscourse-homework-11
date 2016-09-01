let result = document.querySelector('#result');

let GetDirectoryContent = new Promise((resolve) => {
    let xhr = new XMLHttpRequest();

    xhr.open('GET','/result.json');
    xhr.responseType = 'json';
    xhr.addEventListener('load', () => {
        resolve(xhr.response);
    });
    xhr.send();
});

GetDirectoryContent.then((json) => {
    let depth = 0,
        html = '';
    function printJSON(source){
        // Для вывода в консоль
        /*let tab = '   ',
            tree = '|--';
        console.log(`${tab.repeat(depth)}${(depth > 0)? tree : ''}${source.name} (${source.size} kb)`);*/
        let offset = 15 * depth;
        html += `<div class="row">
                    <div class="col-xs-12" style="margin-left: ${offset}px">
                        <span class="glyphicon glyphicon-${(source.type == 'dir')? 'folder-open' : 'file'}"></span>
                        ${source.name} (<span class="glyphicon glyphicon-floppy-disk">${source.size}</span> kb)
                    </div>
                </div>`;

        if (source.items) {
            depth++;
            for (let item of source.items){
                printJSON(item)
            }
            depth--;
        }
        return html;
    }
    result.innerHTML = printJSON(json);
});