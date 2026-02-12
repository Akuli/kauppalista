document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("signOutButton").onclick = () => firebase.auth().signOut();

  let dbDoc = null;
  let saveCounter = 0;

  function showSaveStatus(isError) {
    const statusText = document.getElementById("statusText");

    if (saveCounter > 1) {
      statusText.textContent = "Saving... (" + saveCounter + ")";
      statusText.style.color = "";
    } else if (saveCounter === 1) {
      statusText.textContent = "Saving...";
      statusText.style.color = "";
    } else {
      if (isError) {
        statusText.textContent = "Saving failed!";
        statusText.style.color = "#cc0000";
      } else {
        statusText.textContent = "Saved!";
        statusText.style.color = "#00cc00";
      }
    }
  }

  async function saveToDb() {
    saveCounter++;
    showSaveStatus(false);

    const toBuyList = document.getElementById("itemListBuy");
    const boughtList = document.getElementById("itemListBought");

    let isError = false;
    try {
      await dbDoc.set({
        toBuy: [...toBuyList.children].map(item => item.querySelector("span").textContent),
        bought: [...boughtList.children].map(item => item.querySelector("span").textContent),
      });
    } catch(e) {
      console.log(e);
      isError = true;
    }

    saveCounter--;
    showSaveStatus(isError);
  }

  function beginTextEditing(item) {
    item.querySelector("span").style.display = "none";
    item.querySelector("input").style.display = "";
    item.querySelector("input").value = item.querySelector("span").textContent;
    item.querySelector("input").select();
    window.setTimeout(() => item.querySelector("input").focus(), 1);
  }

  function endTextEditing(item) {
    item.querySelector("input").style.display = "none";
    item.querySelector("span").style.display = "";

    const newText = item.querySelector("input").value.trim();
    if (newText) {
      item.querySelector("span").textContent = newText;
      sortBoughtList();
    } else {
      // If there is old text, keep it.
      // If not, delete item, because user created new item and never wrote text to it.
      if (!item.querySelector("span").textContent) {
        item.remove();
      }
    }
    saveToDb();
  }

  let draggedItem = null;

  function createItem() {
    const item = document.createElement("div");
    item.classList.add("item");
    item.draggable = true;
    item.innerHTML = '<span></span><input style="display:none;" /><button>&nbsp;X&nbsp;</button>';

    if (!/lava(\.html?)$/.test(window.location.pathname)) {
      item.querySelector("span").onclick = () => beginTextEditing(item);
    }
    item.querySelector("input").addEventListener("focusout", () => endTextEditing(item));
    item.querySelector("input").addEventListener("keyup", e => {if(e.key==="Enter") e.target.blur()});

    // Delete when X button is clicked
    item.querySelector("button").onclick = () => {
      const text = item.querySelector("span").textContent;
      if (confirm(`Delete item "${text}"?`)) {
        item.remove();
        saveToDb();
      }
    };

    item.addEventListener("dragstart", () => { draggedItem = item; item.classList.add("dragged"); });
    item.addEventListener("dragend", () => { draggedItem = null; item.classList.remove("dragged"); sortBoughtList(); saveToDb(); });

    return item;
  }

  function createItemAndStartEditing() {
    const item = createItem();
    beginTextEditing(item);
    document.getElementById("itemListBuy").appendChild(item);
  }

  document.getElementById("newItemButton").onclick = createItemAndStartEditing;

  // there seems to be no good way to detect if user has keyboard
  // https://stackoverflow.com/a/18880989
  if (!("ontouchstart" in document.documentElement)) {
    document.getElementById("newItemButton").textContent += " (N)";
    document.addEventListener("keydown", event => {
      if (document.activeElement === document.body && event.key.toLowerCase() === 'n') {
        createItemAndStartEditing();
      }
    });
  }

  for (const itemList of document.querySelectorAll(".itemList")) {
    itemList.parentElement.ondragover = event => {
      if (draggedItem === null) {
        // Happens if user drags something completely unrelated into this app
        return;
      }

      for (const item of itemList.children) {
        const r = item.getBoundingClientRect();
        if ((r.top + r.bottom)/2 > event.clientY) {
          item.insertAdjacentElement("beforebegin", draggedItem);
          return;
        }
      }
      itemList.appendChild(draggedItem);
    };
  }

  function sortBoughtList() {
    // https://stackoverflow.com/a/50127768
    const boughtList = document.getElementById("itemListBought");
    const items = [...boughtList.children];
    const sortKey = item => item.querySelector("span").textContent.toLowerCase();
    items.sort((a,b) => (sortKey(a)>sortKey(b)) ? 1 : -1);
    for (const item of items) {
      boughtList.appendChild(item);
    }
  }

  function updateItemsList(listElement, newStrings) {
    // Remove elements where they first differ
    while (listElement.childElementCount > newStrings.length) {
      [...listElement.children]
        .find((item, i) => newStrings[i] !== item.querySelector("span").textContent)
        .remove();
    }

    // Always adding to end is good because new items usually go to end
    // TODO: we can do better when in the bought list where the items are sorted
    while (listElement.childElementCount < newStrings.length) {
      listElement.appendChild(createItem());
    }

    for (let i = 0; i < newStrings.length; i++) {
      listElement.children[i].querySelector("span").textContent = newStrings[i];
    }
  }

  function setItems(itemsObject) {
    updateItemsList(document.getElementById("itemListBuy"), itemsObject.toBuy);
    updateItemsList(document.getElementById("itemListBought"), itemsObject.bought);
    sortBoughtList();
  }

  // https://stackoverflow.com/a/37901056
  firebase.auth().onAuthStateChanged(async(user) => {
    if (!user) {
      window.location.href = window.location.origin + window.location.pathname.replace(/\/[^/]*$/,"") + "/login.html";
      return;
    }

    dbDoc = firebase.firestore().collection("lists").doc(firebase.auth().getUid());

    let data = (await dbDoc.get()).data();
    if (data === undefined) {
      // New user
      data = {toBuy: [], bought: []};
      await dbDoc.set(data);
    }

    setItems(data);
    dbDoc.onSnapshot(doc => setItems(doc.data()));

    document.getElementById("newItemButton").disabled = false;
    document.getElementById("loadingOverlay").style.display = 'none';
  });
});
