import { extension_helper } from "./helper";
import "arrive";
import dayjs from "dayjs";
import createDivObserver from "roamjs-components/dom/createDivObserver";
import "./style.css";
import { PullBlock } from "roamjs-components/types";

const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

const ancestorrule = `[ 
   [ (ancestor ?child ?parent) 
        [?parent :block/children ?child] ]
   [ (ancestor ?child ?a) 
        [?parent :block/children ?child ] 
        (ancestor ?parent ?a) ] ] ]`;

const roam = {
  countBlocksOnPageByUid(uids: string[]) {
    console.log(uids, " -----uids");
    return window.roamAlphaAPI.data.fast.q(
      `
      [
        :find ?uids (count ?child)
        :in $ % [?uids ...]
        :where
          [?page :block/uid ?uids]
          (ancestor ?child ?page)
      ]
    `,
      ancestorrule,
      uids
    ) as [string, number][];
  },
  countLinksToPageByUid(uids: string[]) {
    return window.roamAlphaAPI.data.fast
      .q(
        `
      [
        :find ?uids (pull ?e [:block/_refs])
        :in $ % [?uids ...]
        :where
          [?e _ ?uids]
      ]
    `,
        ancestorrule,
        uids
      )
      .filter((item) => item[1]) as [string, { ":block/_refs": PullBlock[] }][];
  },
  countTodoDueToDayByUid(uid: string) {
    const dueUid = window.roamAlphaAPI.q(`
      [ 
        :find ?e .
        
        :where
          [?page :node/title "due"]
          [?page :block/uid ?e]]`);
    if (!dueUid) {
      return 0;
    }
    return window.roamAlphaAPI.q(
      `
[
    :find (count ?e) .
    :in $ [?tag1 ?tag2]
    :where
     [?e :block/refs ?ref1]
     [?e :block/refs ?ref2]
     [?ref1 :block/uid ?tag1]
     [?ref2 :block/uid ?tag2]
]
`,
      [uid, dueUid]
    );
  },
};

let observer: MutationObserver;
const onDateSelect = (el: HTMLElement) => {
  console.log(el, "--");
  const queryAllDate = async () => {
    const ariaLabels = [...el.querySelectorAll("[aria-label]")].reduce(
      (p, itemEl) => {
        const dayUid = dayjs(itemEl.getAttribute("aria-label")).format(
          "MM-DD-YYYY"
        );
        // 1. 找到该天页面上有多少个 blocks
        // 2. 找到该天被多少个 linked 到了
        // 3. 找到该天有多少个 TODO due to
        // return [itemEl, dayUid] as const;
        p[dayUid] = {
          el: itemEl as HTMLElement,
          uid: dayUid,
        };
        return p;
      },
      {} as Record<string, { el: HTMLElement; uid: string }>
    );
    await delay();
    console.time("1");
    const blockCountMap = roam
      .countBlocksOnPageByUid(Object.keys(ariaLabels))
      .reduce((p, c) => {
        p[c[0]] = c[1];
        return p;
      }, {} as Record<string, number>);
    console.timeEnd("1");
    const linkedMap = roam
      .countLinksToPageByUid(Object.keys(ariaLabels))
      .reduce((p, c) => {
        p[c[0]] = true;
        return p;
      }, {} as Record<string, boolean>);
    console.log(" ----", linkedMap, blockCountMap);

    Object.keys(ariaLabels).forEach((key) => {
      const { uid, el } = ariaLabels[key];
      const count = roam.countTodoDueToDayByUid(uid);
      if (count) {
        el.firstElementChild.classList.add("due");
        el.firstElementChild.setAttribute("data-size", count + "");
      }
      if (linkedMap[uid]) {
        el.firstElementChild.classList.add("outline");
      }
      let style = linkedMap[uid]
        ? `
         `
        : "";

      if (blockCountMap[uid] > 0) {
        el.firstElementChild.classList.add("calendar-day");
        el.firstElementChild.setAttribute(
          `data-level`,
          `${Math.min(4, Math.ceil(blockCountMap[uid] / 20))}`
        );
      }

      el.firstElementChild.setAttribute("style", style);
    });

    return ariaLabels;
  };
  observer = createDivObserver((mutationList) => {
    console.log(mutationList, " --");
    if (mutationList.length > 20) queryAllDate();
  }, el);
  queryAllDate();
  extension_helper.on_uninstall(() => {
    observer.disconnect();
  });
};

const onDateDismiss = () => {
  observer.disconnect();
};

export default {
  onload() {
    document.arrive(".rm-jump-date-picker", onDateSelect);
    document.leave(".rm-jump-date-picker", onDateDismiss);
    extension_helper.on_uninstall(() => {
      document.unbindArrive(onDateSelect);
      document.unbindLeave(onDateDismiss);
    });
  },
  onunload() {
    extension_helper.uninstall();
  },
};
