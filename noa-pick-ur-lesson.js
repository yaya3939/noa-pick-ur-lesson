// ==UserScript==
// @name         pick ur noa lesson unwrap
// @namespace    http://tampermonkey.net/
// @version      2024-04-22
// @description  Make ur own noa dance acadamy schedule.
// @author       ahiru
// @match        https://www.noadance.com/schedule_search/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.deleteValue
// @grant        GM.addStyle
// ==/UserScript==

async function main() {
  //Nodes
  const searchbox = document.querySelector(".searchbox");
  const firstUl = searchbox.querySelector("ul");
  const genreCheckboxes = searchbox
    .querySelector(".genre")
    .querySelectorAll('input[type="checkbox"]');
  const locationCheckboxes = firstUl.querySelectorAll('input[type="checkbox"]');
  const searchBtn = searchbox.querySelector(".conf").querySelector("button");
  const targetNode = document.getElementById("js-container");

  //chosen lessons
  const storedString0 = await GM.getValue("chosenLessons", null);
  const storedSelectedValues0 = JSON.parse(storedString0);
  const chosenLessons = storedSelectedValues0 ? storedSelectedValues0 : [];

  //customized search values
  const storedString = await GM.getValue("selectedValues", null);
  const storedSelectedValues = JSON.parse(storedString);
  const selectedValues = storedSelectedValues
    ? storedSelectedValues
    : {
        levels: [],
        fromTime: "",
        toTime: "",
        workdayOnly: false,
        locations: [],
        genres: [],
        chosenLessonOnly: false,
      };

  //others
  var mutationCount = 0;
  const config = { childList: true, subtree: true };

  // (function () {
  addStyle();
  createSelectAllNode();
  createLevelsNode();
  createTimeNode();
  createBtnsNode();

  searchBtn.addEventListener("click", () => {
    handleMutation();
  });

  const observer = new MutationObserver(handleMutation);

  // 启动 MutationObserver，开始监视目标节点的变化
  observer.observe(targetNode, config);
  // })();

  function createLevelsNode() {
    const levelHTML = `<p>LEVEL</p>
      <ul id='level'>
        <li>
          <input type="checkbox" id="超入門" value="超入門">
          <label for="超入門">超入門</label>
        </li>
        <li>
          <input type="checkbox" id="入門" value="入門">
          <label for="入門">入門</label>
        </li>
        <li>
          <input type="checkbox" id="初級" value="初級">
          <label for="初級">初級</label>
        </li>
        <li>
          <input type="checkbox" id="中級" value="中級">
          <label for="中級">中級</label>
        </li>
      </ul>`;

    //create levels selector
    firstUl.parentNode.insertAdjacentHTML("afterbegin", levelHTML);
    const levelsEl = searchbox.querySelector("#level");
    const levelcheckboxes = levelsEl.querySelectorAll('input[type="checkbox"]');
    levelcheckboxes.forEach((checkbox) => {
      //init stored levels
      if (selectedValues.levels.length > 0) {
        selectedValues.levels.forEach((selectedLevel) => {
          if (checkbox.value === selectedLevel) {
            checkbox.checked = true;
          }
        });
      }
      //remember the chosen levels
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          selectedValues.levels.push(checkbox.value);
        } else {
          const index = selectedValues.levels.indexOf(checkbox.value);
          if (index !== -1) {
            selectedValues.levels.splice(index, 1);
          }
        }
      });
    });
  }

  function createTimeNode() {
    const timeSelectHTML = `
    <div style="
    padding: 10px 0 35px 0;
">
     <p>TIME SPAN</p>
     <input type="time" id="fromTime" placeholder="From" min="00:00" max="23:59" required style="
    display: unset;
    background-color: #34ceca;
    border: none;
">
<span>~</span>
     <input type="time" id="toTime" placeholder="To" min="00:00" max="23:59" required style="
    display: unset;
    background-color: #34ceca;
    border: none;
">
<input type="checkbox" id="timeType" value="wd">
<label for="timeType">workday only</label>
    </div>`;

    //create time selector
    firstUl.parentNode.insertAdjacentHTML("afterbegin", timeSelectHTML);
    const fromTimeInput = document.querySelector("#fromTime");
    const toTimeInput = document.querySelector("#toTime");
    const workdayOnly = searchbox.querySelector("#timeType");
    //init stored time selector
    if (selectedValues.fromTime) {
      fromTimeInput.value = selectedValues.fromTime;
    }
    if (selectedValues.toTime) {
      toTimeInput.value = selectedValues.toTime;
    }
    workdayOnly.checked = selectedValues.workdayOnly;
    // remember the selected time limit
    fromTimeInput.addEventListener("change", () => {
      selectedValues.fromTime = fromTimeInput.value;
    });
    toTimeInput.addEventListener("change", () => {
      selectedValues.toTime = toTimeInput.value;
    });
    workdayOnly.addEventListener("change", () => {
      selectedValues.workdayOnly = workdayOnly.checked;
    });
  }

  function createSelectAllNode() {
    //create select all location btn
    const selectAllButton = document.createElement("button");
    selectAllButton.textContent = "Select All";
    selectAllButton.style.marginBottom = "5px";
    selectAllButton.style.backgroundColor = "#34ceca";
    selectAllButton.style.padding = "5px";
    firstUl.parentNode.insertBefore(selectAllButton, firstUl);
    const locationCheckboxes = firstUl.querySelectorAll(
      'input[type="checkbox"]'
    );
    // 点击按钮时选中所有复选框
    selectAllButton.addEventListener("click", () => {
      locationCheckboxes.forEach((checkbox) => {
        if (!checkbox.checked) {
          checkbox.click();
        }
      });
    });
  }

  function createBtnsNode() {
    const ExecuteBtns = `<div style="display: flex;justify-content: center;align-items: baseline;">
    <button id="saveBtn" style="padding: 5px;background-color: rgb(52, 206, 202);margin-right: 20px;">
      Save this?
    </button>
    <button id="deleteBtn" style="padding: 5px;background-color: rgb(52, 206, 202);margin-right: 20px;">
      Delete this?
    </button>
    <input type="checkbox" id="displayBtn" value="displayBtn" style="padding: 5px;">
    <label for="displayBtn">display chosen lessons only?</label>
  </div>`;

    //create execute btns
    document
      .querySelector(".schedule-foot")
      .insertAdjacentHTML("beforebegin", ExecuteBtns);

    const saveBtn = document.getElementById("saveBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const displayBtn = document.getElementById("displayBtn");

    displayBtn.checked = selectedValues.chosenLessonOnly;

    //save this chosen status to local
    saveBtn.addEventListener("click", async () => {
      //remember chosen locations
      locationCheckboxes.forEach((checkbox) => {
        if (
          checkbox.checked &&
          !selectedValues.locations.includes(checkbox.id)
        ) {
          selectedValues.locations.push(checkbox.id);
        } else if (
          !checkbox.checked &&
          selectedValues.locations.includes(checkbox.id)
        ) {
          const index = selectedValues.locations.indexOf(checkbox.id);
          if (index !== -1) {
            selectedValues.locations.splice(index, 1);
          }
        }
      });
      //remember chosen genres
      genreCheckboxes.forEach((checkbox) => {
        if (checkbox.checked && !selectedValues.genres.includes(checkbox.id)) {
          selectedValues.genres.push(checkbox.id);
        } else if (
          !checkbox.checked &&
          selectedValues.genres.includes(checkbox.id)
        ) {
          const index = selectedValues.genres.indexOf(checkbox.id);
          if (index !== -1) {
            selectedValues.genres.splice(index, 1);
          }
        }
      });
      //remember displayBtn value
      selectedValues.chosenLessonOnly = displayBtn.checked;

      //store selectedValues to local
      const jsonSelectedValues = JSON.stringify(selectedValues);
      await GM.setValue("selectedValues", jsonSelectedValues);

      //chosenLessons
      const jsonChosenLessons = JSON.stringify(chosenLessons);
      console.log(jsonChosenLessons);
      await GM.setValue("chosenLessons", jsonChosenLessons);
      console.log("saved");
    });

    deleteBtn.addEventListener("click", async () => {
      await GM.deleteValue("selectedValues");
      await GM.deleteValue("chosenLessons");
      console.log("deleted");
    });
  }

  async function addStyle() {
    const customizedCSS = `
  .unmatchCustomizedLimits {
      display:none;
  }

  .unchosenLesson{

  }

  .dontShowThis {
      display:none;
  }
  `;

    await GM.addStyle(customizedCSS);
  }

  function initOriginSearch() {
    //init locations & genres
    var locationInit = false;
    var genreInit = false;
    if (selectedValues.locations.length > 0) {
      locationCheckboxes.forEach((checkbox) => {
        if (
          selectedValues.locations.includes(checkbox.id) &&
          !checkbox.checked
        ) {
          checkbox.click();
        }
      });
      locationInit = true;
    }

    if (selectedValues.genres.length > 0) {
      genreCheckboxes.forEach((checkbox) => {
        if (!selectedValues.genres.includes(checkbox.id) && checkbox.checked) {
          checkbox.click();
        }
      });
      genreInit = true;
    }

    if (locationInit || genreInit) {
      searchBtn.click();
      console.log("initOriginSearch");
    }
  }

  function customizedSearch(classBox) {
    //hide unchosen level lessons && unmatch times lessons
    const level = classBox.querySelector(".rec_level_name");

    const timeRange = classBox.querySelector(".lessontime").innerText;
    const [startTime, endTime] = splitTimeRange(timeRange);
    const workdayOnly = searchbox.querySelector("#timeType");
    const weekday =
      classBox.parentNode.parentNode.parentNode.parentNode.querySelector(
        "h2"
      ).innerText;

    if (
      (selectedValues.levels.length > 0 &&
        !selectedValues.levels.includes(level.innerText)) ||
      ((!workdayOnly.checked ||
        (workdayOnly.checked && weekday !== "SAT" && weekday !== "SUN")) &&
        ((selectedValues.fromTime &&
          compareTimes(selectedValues.fromTime, startTime)) ||
          (selectedValues.toTime &&
            compareTimes(endTime, selectedValues.toTime))))
    ) {
      classBox.classList.add("unmatchCustomizedLimits");
    } else {
      classBox.classList.remove("unmatchCustomizedLimits");
    }
  }

  function createChooseBoxes(classBox) {
    const lesson = {
      time: classBox.querySelector(".lessontime").innerText,
      name: classBox.querySelector(".nickname").innerText,
      genre: classBox.querySelector(".genre_sub_name").innerText,
      level: classBox.querySelector(".rec_level_name").innerText,
      address: classBox
        .querySelector(".info")
        .querySelector("a")
        .querySelector("span").innerText,
    };
    const id = `${lesson.time}${lesson.name}${lesson.genre}${lesson.level}${lesson.address}`;
    const radiosHTML = `<div>
    <input type="radio" class="chooseUr" name="Choose${id}" id="mainChoose${id}" value="main">
    <label for="mainChoose${id}">main</label>
    <input type="radio" class="chooseUr" name="Choose${id}" id="optChoose${id}" value="opt">
    <label for="optChoose${id}">opt</label>
        </div>`;

    if (!classBox.querySelector(".chooseUr")) {
      classBox.insertAdjacentHTML("beforeend", radiosHTML);
    }
  }

  function handleMutation() {
    mutationCount++;
    console.log(mutationCount);
    console.log(selectedValues);
    if (mutationCount === 1) {
      initOriginSearch();
    }

    //init lessons
    const classBoxes = document.querySelectorAll(".class-box");
    classBoxes.forEach((classBox) => {
      customizedSearch(classBox);

      //create lesson shoose type radios
      createChooseBoxes(classBox);

      classBox.classList.add("unchosenLesson");

      //init and rememer ur chosen lessons
      const chooseBoxes = classBox.querySelectorAll(".chooseUr");
      chooseBoxes &&
        chooseBoxes.forEach((radio) => {
          const classBox = radio.parentNode.parentNode;

          //init chosen lessons
          if (chosenLessons.length > 0) {
            if (chosenLessons.includes(radio.id) && !radio.checked) {
              radio.checked = true;
              if (radio.value === "main") {
                classBox.style.backgroundColor = "rgba(52, 206, 180, 0.6)";
              } else {
                classBox.style.backgroundColor = "rgba(52, 206, 180, 0.2)";
              }
            }
            if (chosenLessons.includes(radio.id)) {
              console.log(classBox);
              classBox.classList.remove("unchosenLesson");
            }
          }

          radio.addEventListener("mousedown", function (event) {
            const lessonid = radio.id;
            // unchecked
            if (this.checked) {
              const handleMouseUp = () => {
                setTimeout(() => {
                  radio.checked = false;
                  classBox.style.backgroundColor = "#fff";
                  classBox.classList.add("unchosenLesson");
                  //delete from chosen lessons
                  const index = chosenLessons.indexOf(lessonid);
                  if (index !== -1) {
                    chosenLessons.splice(index, 1);
                  }
                }, 5);
                radio.removeEventListener("mouseup", handleMouseUp);
              };
              radio.addEventListener("mouseup", handleMouseUp);
            } else {
              //checked
              if (radio.value === "main") {
                classBox.style.backgroundColor = "rgba(52, 206, 180, 0.6)";
              } else {
                classBox.style.backgroundColor = "rgba(52, 206, 180, 0.2)";
              }
              classBox.classList.remove("unchosenLesson");
              //add to chosen lessons
              if (!chosenLessons.includes(lessonid)) {
                chosenLessons.push(lessonid);
                if (radio.value === "main") {
                  const index = chosenLessons.indexOf("opt" + radio.name);
                  if (index !== -1) {
                    chosenLessons.splice(index, 1);
                  }
                } else {
                  const index = chosenLessons.indexOf("main" + radio.name);
                  if (index !== -1) {
                    chosenLessons.splice(index, 1);
                  }
                }
              }
            }
            console.log(chosenLessons);
          });
        });

      //init show or not
      if (selectedValues.chosenLessonOnly) {
        const unChosenLessons = document.querySelectorAll(".unchosenLesson");
        unChosenLessons.forEach((unChosenLesson) => {
          unChosenLesson.classList.add("dontShowThis");
        });
      }

      //show or not
      const displayBtn = document.getElementById("displayBtn");
      displayBtn.addEventListener("change", () => {
        if (displayBtn.checked) {
          const unChosenLessons = document.querySelectorAll(".unchosenLesson");
          unChosenLessons.forEach((unChosenLesson) => {
            unChosenLesson.classList.add("dontShowThis");
          });
        } else {
          const dontShowThis = document.querySelectorAll(".dontShowThis");
          dontShowThis.forEach((a) => {
            a.classList.remove("dontShowThis");
          });
        }
      });
    });
  }

  function splitTimeRange(timeRange) {
    // 使用正则表达式匹配时间范围中的开始时间和结束时间
    var regex = /(\d{2}:\d{2})～(\d{2}:\d{2})/;
    var matches = timeRange.match(regex);

    // 如果匹配成功
    if (matches && matches.length === 3) {
      var startTime = matches[1]; // 开始时间
      var endTime = matches[2]; // 结束时间
      return [startTime, endTime];
    } else {
      // 如果匹配失败，返回空数组或者null，表示无效的时间范围字符串
      return null;
    }
  }
  function compareTimes(time1, time2) {
    //if time1 late than time2 return true
    // 分割时间字符串以获取小时和分钟
    var time1Parts = time1.split(":");
    var time2Parts = time2.split(":");

    // 将小时和分钟转换为整数
    var hour1 = parseInt(time1Parts[0], 10);
    var minute1 = parseInt(time1Parts[1], 10);
    var hour2 = parseInt(time2Parts[0], 10);
    var minute2 = parseInt(time2Parts[1], 10);

    // 比较小时
    if (hour1 < hour2) {
      return false;
    } else if (hour1 > hour2) {
      return true;
    } else {
      // 如果小时相同，则比较分钟
      if (minute1 < minute2) {
        return false;
      } else if (minute1 > minute2) {
        return true;
      } else {
        // 如果分钟也相同，则时间相同
        return true;
      }
    }
  }
}

main();
