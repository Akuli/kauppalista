document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("signOutButton").onclick = () => firebase.auth().signOut();

  let dbDoc = null;

  async function saveToDb() {
    console.log("Saving begins...");
    const [toBuyList, boughtList] = document.querySelectorAll(".itemList");
    await dbDoc.set({
      toBuy: [...toBuyList.children].map(item => item.querySelector("span").textContent),
      bought: [...boughtList.children].map(item => item.querySelector("span").textContent),
    });
    console.log("Saving done");
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
      saveToDb();
    }
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
      window.location.href = window.location.origin + "/login.html";
      return;
    }

    // FIXME: create doc if not exists
    dbDoc = firebase.firestore().collection("lists").doc(firebase.auth().getUid());
    window.dbDocForDebugging = dbDoc;  // TODO: remove

    const data = (await dbDoc.get()).data();
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
