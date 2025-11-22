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
const todoUid = window.roamAlphaAPI.q(`
      [ 
        :find ?e .
        :where
          [?page :node/title "TODO"]
          [?page :block/uid ?e]]`);

const roam = {
  countBlocksOnPageByUid(uids: string[]) {
    // console.log(uids, " -----uids");
    // @ts-ignore
    return window.roamAlphaAPI.data.async.fast.q(
      `
      [
        :find ?uids (count ?child)
        :in $ % [?uids ...]
        :where
          [?page :block/uid ?uids]
          [?child :block/page ?page]
      ]
    `,
      ancestorrule,
      uids
    ) as [string, number][];
  },
  countLinksToPageByUid(
    uids: string[]
  ): Promise<[string, { ":block/_refs": PullBlock[] }][]> {
    // @ts-ignore
    return window.roamAlphaAPI.data.async.fast
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
      .then((res: any) => {
        return res.filter(
          (item: [string, { ":block/_refs": PullBlock[] }]) => item[1]
        );
      });
  },
  async countTodoDueToDayByUid(uid: string, dueUid: string) {
    if (!dueUid) {
      return 0;
    }
    // @ts-ignore
    return window.roamAlphaAPI.data.async.fast.q(
      `
[
    :find (count ?e) .
    :in $ [?uid ?due ?todo]
    :where
     [?ref1 :block/uid ?uid]
     [?ref2 :block/uid ?due]
     [?e :block/refs ?ref1]
     [?e :block/refs ?ref2]
     [?p :block/children ?e]
     [?pref1 :block/uid ?todo]
     [?p :block/refs ?pref1]
]
`,
      [uid, dueUid, todoUid]
    );
  },
};

let observer: MutationObserver;
const onDateSelect = (el: HTMLElement) => {
  const queryAllDate = async () => {
    console.log("@ --");

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
    const allBlocks = await roam.countBlocksOnPageByUid(
      Object.keys(ariaLabels)
    );
    console.log({ allBlocks });
    const blockCountMap = allBlocks.reduce((p, c) => {
      p[c[0]] = c[1];
      return p;
    }, {} as Record<string, number>);
    console.timeEnd("1");
    const allLinks = await roam.countLinksToPageByUid(Object.keys(ariaLabels));
    const linkedMap = allLinks.reduce((p, c) => {
      p[c[0]] = true;
      return p;
    }, {} as Record<string, boolean>);
    // console.log(" ----", linkedMap, blockCountMap);
    console.time("123");
    const dueUid = window.roamAlphaAPI.q(`
      [ 
        :find ?e .
        :where
          [?page :node/title "${getTargetTitle()}"]
          [?page :block/uid ?e]]`) as unknown as string;
    Object.keys(ariaLabels).forEach(async (key) => {
      const { uid, el } = ariaLabels[key];
      const count = await roam.countTodoDueToDayByUid(uid, dueUid);
      if (count) {
        el.firstElementChild.classList.add("due");
        el.firstElementChild.setAttribute("data-size", count + "");
      }
      if (linkedMap[uid]) {
        el.firstElementChild.classList.add("outline");
      }

      if (blockCountMap[uid] > 0) {
        el.firstElementChild.classList.add("calendar-day");
        el.firstElementChild.setAttribute(
          `data-level`,
          `${Math.min(4, Math.ceil(blockCountMap[uid] / 20))}`
        );
      }
    });
    console.timeEnd("123");

    return ariaLabels;
  };
  observer = createDivObserver((mutationList) => {
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

let API: RoamExtensionAPI;

const panelSetup = () => {
  API.settings.panel.create({
    tabTitle: "Datepick enhancer",
    settings: [
      {
        id: "due",
        name: "Page title for due tasks",
        description:
          "A page which will represent a due task when mentioned beneath a TODO, or 0 to disable this functionality.",
        action: {
          type: "input",
          placeholder: "due",
        },
      },
    ],
  });
};

const getTargetTitle = () => {
  return API.settings.get("due") || "due";
};

export default {
  onload({ extensionAPI }: { extensionAPI: RoamExtensionAPI }) {
    API = extensionAPI;
    panelSetup();
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
