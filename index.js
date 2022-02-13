document.addEventListener("DOMContentLoaded", () => {
  // https://stackoverflow.com/a/37901056
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = window.location.origin + "/login.html";
    }
  });

  document.getElementById("signOutButton").onclick = () => firebase.auth().signOut();

  const db = firebase.firestore();

  function beginTextEditing(item) {
    item.querySelector("span").style.display = "none";
    item.querySelector("input").style.display = "";
    item.querySelector("input").value = item.querySelector("span").textContent;
    item.querySelector("input").select();
    window.setTimeout(() => item.querySelector("input").focus(), 1);
  }

  let draggedItem = null;

  function createItem(editNow = false) {
    const item = document.createElement("div");
    item.classList.add("item");
    item.draggable = true;
    item.innerHTML = '<span></span><input style="display:none;" /><button>X</button>';

    item.querySelector("span").onclick = () => beginTextEditing(item);

    // Text editing is done when unfocusing
    function endTextEditing() {
      item.querySelector("input").style.display = "none";
      item.querySelector("span").style.display = "";

      const newText = item.querySelector("input").value.trim();
      if (newText) {
        item.querySelector("span").textContent = newText;
      }
    }
    item.querySelector("input").addEventListener("focusout", endTextEditing);
    item.querySelector("input").addEventListener("keyup", e => {if(e.key==="Enter") endTextEditing()});

    // Delete when X button is clicked
    item.querySelector("button").onclick = () => {
      const text = item.querySelector("span").textContent;
      if (confirm(`Delete item "${text}"?`)) {
        item.remove();
      }
    };

    item.addEventListener("dragstart", () => { draggedItem = item; item.classList.add("dragged"); });
    item.addEventListener("dragend", () => item.classList.remove("dragged"));

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
});
