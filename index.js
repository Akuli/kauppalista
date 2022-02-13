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
    const [toBuyList, boughtList] = document.querySelectorAll(".itemList");

    for (const text of data.toBuy) {
      const item = createItem();
      item.querySelector("span").textContent = text;
      toBuyList.appendChild(item);
    }

    for (const text of data.bought) {
      const item = createItem();
      item.querySelector("span").textContent = text;
      boughtList.appendChild(item);
    }

    document.getElementById("newItemButton").disabled = false;
    document.getElementById("loadingOverlay").style.display = 'none';
  });
});
