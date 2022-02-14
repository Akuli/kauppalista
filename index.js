document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("signOutButton").onclick = () => firebase.auth().signOut();

  let dbDoc = null;
  let saveCounter = 0;

  async function showSaveStatus(isError) {
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
    const statusText = document.getElementById("statusText");

    saveCounter++;
    showSaveStatus(false);

    const [toBuyList, boughtList] = document.querySelectorAll(".itemList");

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
    }
    saveToDb();
  }

  let draggedItem = null;

  function createItem(editNow = false) {
    const item = document.createElement("div");
    item.classList.add("item");
    item.draggable = true;
    item.innerHTML = '<span></span><input style="display:none;" /><button>X</button>';

    item.querySelector("span").onclick = () => beginTextEditing(item);
    item.querySelector("input").addEventListener("focusout", () => endTextEditing(item));
    item.querySelector("input").addEventListener("keyup", e => {if(e.key==="Enter") event.target.blur()});

    // Delete when X button is clicked
    item.querySelector("button").onclick = () => {
      const text = item.querySelector("span").textContent;
      if (confirm(`Delete item "${text}"?`)) {
        item.remove();
        saveToDb();
      }
    };

    item.addEventListener("dragstart", () => { draggedItem = item; item.classList.add("dragged"); });
    item.addEventListener("dragend", () => { item.classList.remove("dragged"); saveToDb(); });

    return item;
  }

  document.getElementById("newItemButton").onclick = () => {
    const item = createItem();
    beginTextEditing(item);
    document.querySelector(".itemList").appendChild(item);
  };

  for (const itemList of document.querySelectorAll(".itemList")) {
    itemList.parentElement.ondragover = event => {
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

  function updateItemsList(listElement, newStrings) {
    // Remove elements where they first differ
    while (listElement.childElementCount > newStrings.length) {
      [...listElement.children]
        .find((item, i) => newStrings[i] !== item.querySelector("span").textContent)
        .remove();
    }

    // Always adding to end is good because new items usually go to end
    while (listElement.childElementCount < newStrings.length) {
      listElement.appendChild(createItem());
    }

    for (let i = 0; i < newStrings.length; i++) {
      listElement.children[i].querySelector("span").textContent = newStrings[i];
    }
  }

  function setItems(itemsObject) {
    const [toBuyList, boughtList] = document.querySelectorAll(".itemList");
    updateItemsList(toBuyList, itemsObject.toBuy);
    updateItemsList(boughtList, itemsObject.bought);
  }

  // https://stackoverflow.com/a/37901056
  firebase.auth().onAuthStateChanged(async(user) => {
    console.log("auth changed", user.email, user.emailVerified);
    if (!user) {
      window.location.href = window.location.origin + window.location.pathname.replace(/\/[^/]*$/,"") + "/login.html";
      return;
    }

    // TODO: remove 1
    if (!user.emailVerified || 1) {
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
