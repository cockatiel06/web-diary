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
document.ondragstart = () => {
    return false;
}

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

// ダイアログを表示して検索キーワードを取得する
searchButton.onclick = () => {
    closeButton.onclick(); // 検索結果を閉じる
    if (searchDialog.hasAttribute('open') === false) {
        searchDialog.showModal(); // ダイアログを表示
    }

    // ダイアログを閉じるボタンが押された場合
    searchDialogCloseButton.onclick = () => {
        searchInput.value = null;
        searchDialog.close();
    }

    // Esc キーが押された場合
    searchDialog.addEventListener('cancel', function () {
        searchInput.value = null;
    }, false);

    // キーワードが入力された場合
    searchInput.addEventListener('change', function () {
        let keyword = searchInput.value;
        
        // リストの項目数ループして検索する
        for (let target of saveList.getElementsByClassName('saved-item')) {
            search(target, keyword);
        }

        searchInput.value = null; // 検索フォームをリセット
        searchDialog.close(); // ダイアログを閉じる
    }, false);
}

/**
 * リストを検索する
 * @param {HTMLElement} target 検索対象のリストアイテム
 * @param {String} keyword 検索キーワード
 */
function search(target, keyword) {
    keyword = new RegExp(keyword, 'ig');
    let result = target.innerText.match(keyword);
    if (result === null) {
        // 検索キーワードが一致しない場合は非表示にする
        // 一致した記事がリストに表示される
        target.style.display = 'none';
        return;
    }
}

// ヘルプを表示
helpButton.onclick = () => {
    if (helpDialog.hasAttribute('open') === false) {
        helpDialog.showModal();
    }
}

// ヘルプを非表示
helpDialogCloseButton.onclick = () => {
    helpDialog.close();
}

// ファイルを読み込む
addFileInput.addEventListener('change', addFile, false);

/**
 * ファイルを添付する
 */
function addFile() {
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
}

/**
 * ローカルストレージに記事を保存する
 * @param {String} key キーの名称
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

    // サムネイル
    if (contentArea.getElementsByTagName('video').length > 0) {
        video.setAttribute('loop', '');
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('disablepictureinpicture', '');
        video.src = contentArea.getElementsByTagName('video')[0].src;
        container.appendChild(video);
    } else if (contentArea.getElementsByTagName('img').length > 0) {
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
    if (saveList.querySelector(`li[data-key="${key}"]`) != null) {
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

/**
 * 記事を作成する
 */
function create() {
    titleInput.value = null;
    removeAllChildren(contentArea);
    removeAllChildren(createdDate);
    save(Date.now()); // 現在日時をキーにして保存する
}

/**
 * 引数に渡したキーをローカルストレージから削除する
 * @param {String} key キーの名称
 */
function removeData(key) {
    localStorage.removeItem(key);
    if (localStorage.length === 0) {
        create(); // 保存データがない場合は作成する
    }
}

/**
 * ローカルストレージからデータを取得して表示する
 * @param {String} key キーの名称
 */
function getData(key) {
    // データを取得
    let data = JSON.parse(localStorage.getItem(key));

    // プロパティの存在確認
    if ((data.title === undefined) || (data.content === undefined) || (data.createdAt === undefined)) {
        throw new Error(`キー (${key}) の値を取得できません`);
    }

    // 取得したデータを表示
    titleInput.value = data.title;
    contentArea.innerHTML = data.content;
    createdDate.innerText = data.createdAt;
}

/**
 * 引数に渡された要素の情報を取得して操作する
 * @param {HTMLElement} listItem 選択要素
 */
function loadData(listItem) {
    listStyle(listItem); // 表示設定
    listItem.scrollIntoView({ behavior: 'smooth' }); // リストをスクロール
    const key = listItem.dataset.key; // キーを取得する

    if (localStorage.getItem(key) != null) {
        // 保存データを取得して表示する
        try {
            getData(key);
        } catch (error) {
            listItem.remove();
            removeData(key);
            loadData(saveList.firstChild);
            console.log(error.message);
        }

        // 保存（上書き）
        saveButton.onclick = () => {
            save(key);
        }

        // 背景色の設定
        closeButton.onclick = () => {
            listStyle(listItem);
        }

        // 削除
        deleteButton.onclick = () => {
            listItem.remove();
            removeData(key);
            loadData(saveList.firstChild);
        }
    } else {
        listItem.remove();
        saveList.firstChild != null ? loadData(saveList.firstChild) : create();
        console.log(`キー (${key}) の値が存在しません`);
    }
}

// ページ読み込み時
window.onload = () => {
    // 保存データが無い場合は新規作成する
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
    keys.forEach(function (key) {
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
        `リストの表示数が正しくありません`
    );
}