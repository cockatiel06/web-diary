'use strict';

// ツールバー
const createButton = document.getElementById('create-button');
const saveButton = document.getElementById('save-button');
const deleteButton = document.getElementById('delete-button');
const searchButton = document.getElementById('search-button');
const closeButton = document.getElementById('close-button');
const helpButton = document.getElementById('help-button');
const addFileInput = document.getElementById('add-file-input');

// メインコンテンツ
const titleInput = document.getElementById('title-input');
const contentArea = document.getElementById('content-area');
const createdDate = document.getElementById('created-date');
const saveList = document.getElementById('save-list');

// ダイアログ
const searchDialog = document.getElementById('search-dialog');
const searchDialogCloseButton = document.getElementById('search-dialog-close-button');
const searchInput = document.getElementById('search-input');
const helpDialog = document.getElementById('help-dialog');
const helpDialogCloseButton = document.getElementById('help-dialog-close-button');

// ドロップ禁止
document.ondragstart = () => false;

/**
 * 日付の桁を揃える
 * @param {Number} number 日付
 */
function format(number) {
    if (number < 10) {
        number = `0${number}`;
    }
    return number;
}

/**
 * 指定した要素の子要素を全削除する
 * @param {HTMLElement} element 
 */
function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * リストアイテムのスタイルを設定する
 * @param {HTMLElement} listItem 選択要素
 */
function listStyle(listItem) {
    for (let savedItem of saveList.getElementsByClassName('saved-item')) {
        savedItem.style.display = 'flex';
        savedItem.style.backgroundColor = '#ffffff';
        listItem.style.backgroundColor = '#eeeeee';
    }
}

// リスト内を検索する
searchButton.onclick = () => {
    // 検索結果をリセット
    closeButton.onclick();

    // ダイアログを表示
    if (!searchDialog.hasAttribute('open')) {
        searchDialog.showModal();
    }

    // ダイアログを閉じるボタン
    searchDialogCloseButton.onclick = () => {
        searchInput.value = null;
        searchDialog.close();
    }

    // Esc キーが押された場合
    searchDialog.addEventListener('cancel', () => {
        searchInput.value = null;
    }, false);

    // キーワードが入力された場合
    searchInput.addEventListener('change', () => {
        searchDialog.close(searchInput.value);
        searchInput.value = null;

        // リストの項目数ループして検索する
        let keyword = new RegExp(searchDialog.returnValue, 'i');
        for (let target of saveList.getElementsByClassName('saved-item')) {
            if (!keyword.test(target.textContent)) {
                target.style.display = 'none'; // 一致しない項目は非表示にする
            }
        }
    }, false);
}

// ヘルプを表示
helpButton.onclick = () => {
    if (!helpDialog.hasAttribute('open')) {
        helpDialog.showModal();
    }
}

// ヘルプを非表示
helpDialogCloseButton.onclick = () => {
    helpDialog.close();
}

// 画像、動画を添付する
addFileInput.addEventListener('change', () => {
    // 選択されたファイル
    const file = addFileInput.files[0];

    // ファイルサイズの制限
    if (file.size > 1048576) {
        alert(`1MB 以下のファイルを添付できます`);
        addFileInput.value = null;
        return;
    }

    // ファイルを読み込む
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (file.type === 'video/mp4') {
            // 動画ファイル
            const video = document.createElement('video');
            video.setAttribute('contenteditable', 'false');
            video.setAttribute('controlslist', 'nodownload');
            video.setAttribute('disablepictureinpicture', '');
            video.setAttribute('controls', '');
            video.setAttribute('autoplay', '');
            video.setAttribute('loop', '');
            video.src = reader.result;
            contentArea.appendChild(video);
        } else {
            // 画像ファイル
            const image = new Image();
            image.src = reader.result;
            contentArea.appendChild(image);
        }
    }

    addFileInput.value = null; // リセット
}, false);

/**
 * ローカルストレージに記事を保存する
 * @param {String} key 保存（更新）するキーの名称
 */
function save(key) {
    // 保存日時
    const now = new Date();
    const year = now.getFullYear();
    const month = format(now.getMonth() + 1);
    const date = format(now.getDate());
    const hour = format(now.getHours());
    const min = format(now.getMinutes());
    const second = format(now.getSeconds());
    const day = now.getDay();

    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // タイトルが入力されていない場合は Untitled で保存する
    if (titleInput.value.length === 0) {
        titleInput.value = 'Untitled';
    }

    // 保存するデータ
    let data = new Object();
    data.title = titleInput.value;
    data.content = contentArea.innerHTML;
    data.createdAt = `${year}/${month}/${date} ${hour}:${min}:${second} ${dayOfWeek[day]}`;

    // ローカルストレージに保存する
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        titleInput.value = null;
        loadData(saveList.querySelector(`li[data-key="${key}"]`) || saveList.firstChild);
        alert(`「${data.title}」を保存できませんでした。\nローカルストレージの空き領域がありません。\n不要な記事は削除してください。`);
    }

    addToList(key); // 保存した記事をリストに追加する
}

/**
 * 保存したデータをリストに追加する
 * @param {String} key キーの名称
 */
function addToList(key) {
    // 要素を生成
    const container = document.createElement('div');
    const video = document.createElement('video');
    const image = document.createElement('img');
    const title = document.createElement('h3');
    const text = document.createElement('p');

    container.className = 'container';
    video.className = 'thumbnail';
    image.className = 'thumbnail';
    title.className = 'list-title';
    text.className = 'list-text';

    // サムネイル（動画優先）
    if (contentArea.getElementsByTagName('video').length) {
        video.setAttribute('loop', '');
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('disablepictureinpicture', '');
        video.src = contentArea.getElementsByTagName('video')[0].src;
        container.appendChild(video);
    } else if (contentArea.getElementsByTagName('img').length) {
        image.src = contentArea.getElementsByTagName('img')[0].src;
        container.appendChild(image);
    } else {
        image.src = 'blog.svg';
        container.appendChild(image);
    }

    // タイトル
    title.innerText = titleInput.value;
    container.appendChild(title);

    // テキスト
    text.innerText = contentArea.textContent;
    container.appendChild(text);

    // タイトルの入力欄をリセット
    titleInput.value = null;

    // リストに追加する
    if (saveList.querySelector(`li[data-key="${key}"]`)) {
        // 更新
        const savedItem = saveList.querySelector(`li[data-key="${key}"]`);
        removeAllChildren(savedItem);
        savedItem.appendChild(container);
        loadData(savedItem);
    } else {
        // 作成
        const savedItem = document.createElement('li');
        savedItem.className = 'saved-item';
        savedItem.dataset.key = key;
        savedItem.setAttribute('onclick', 'loadData(this)');
        savedItem.appendChild(container);
        saveList.insertBefore(savedItem, saveList.firstChild);
        loadData(savedItem);
    }
}

// 新規作成
createButton.addEventListener('click', create, false);

function create() {
    // 表示内容を削除
    titleInput.value = null;
    removeAllChildren(contentArea);
    removeAllChildren(createdDate);
    save(Date.now()); // 現在日時をキーにして保存する
}

/**
 * 引数に渡されたキーを削除する
 * @param {String} key 削除するキーの名称
 */
function removeData(key) {
    // ローカルストレージとリストから削除する
    localStorage.removeItem(key);
    if (saveList.querySelector(`li[data-key="${key}"]`)) {
        saveList.querySelector(`li[data-key="${key}"]`).remove();
    }

    // 最新の記事を表示（存在しない場合は作成する）
    saveList.firstChild ? loadData(saveList.firstChild) : create();
}

/**
 * ローカルストレージからデータを取得して表示する
 * @param {String} key 取得するキーの名称
 */
function getData(key) {
    let data = JSON.parse(localStorage.getItem(key));
    if (("title" in data) && ("content" in data) && ("createdAt" in data)) {
        titleInput.value = data.title;
        contentArea.innerHTML = data.content;
        createdDate.innerText = data.createdAt;
    } else {
        throw new Error('プロパティが存在しません');
    }
}

/**
 * 引数に渡された要素の情報を取得して操作する
 * @param {HTMLElement} listItem 選択要素
 */
function loadData(listItem) {
    listStyle(listItem); // 表示設定
    listItem.scrollIntoView({ behavior: 'smooth' }); // スクロール

    saveButton.disabled = false; // 保存有効化
    const key = listItem.dataset.key; // キーを取得する

    if (localStorage.getItem(key)) {
        // 保存データを取得して表示する
        try {
            getData(key);
        } catch (error) {
            removeData(key);
            saveButton.disabled = true; // 保存無効化（再選択で解除）
            console.log(error.message);
        }

        saveButton.onclick = () => { save(key) }; // 保存（上書き）
        closeButton.onclick = () => { listStyle(listItem) }; // 背景色の設定
        deleteButton.onclick = () => { removeData(key) }; // 削除
    } else {
        removeData(key);
    }
}

// ページ読み込み時
window.onload = () => {
    // 保存データが無い場合は作成する
    if (localStorage.length === 0) {
        create();
        return;
    }

    // 保存データを作成日時順にリストに追加する
    let keys = new Array();
    for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
    }
    keys.sort();
    keys.forEach(key => {
        try {
            getData(key);
            addToList(key);
        } catch (error) {
            removeData(key);
            console.log(error.message);
        }
    });

    // テスト
    console.assert(
        localStorage.length === saveList.childElementCount,
        `リストの項目数が正しくありません`
    );
}
