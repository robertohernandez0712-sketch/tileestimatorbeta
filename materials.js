const THINSET_COVERAGE = {
  "1/4x1/4": 95,
  "1/4x3/8": 75,
  "1/2x1/2": 45
};

const MASTIC_COVERAGE = {
  "1/4x3/16": {
    "1gal": 35,
    "3.5gal": 122.5
  },
  "1/4x1/4": {
    "1gal": 30,
    "3.5gal": 105
  }
};

const MUDBED_BAG_YIELD_CUFT = 0.5;

function applyWaste(area, wastePercent) {
  const safeArea = Number(area) || 0;
  const safeWaste = Number(wastePercent) || 0;
  return safeArea + (safeArea * safeWaste / 100);
}

function calculateShowerMaterials(area) {
  const measuredWallArea =
    (Number(area.measurements.backWall.width) * Number(area.measurements.backWall.height)) +
    (Number(area.measurements.leftWall.width) * Number(area.measurements.leftWall.height)) +
    (Number(area.measurements.rightWall.width) * Number(area.measurements.rightWall.height));
  const wallArea = area.options?.showerMeasurementMode === "manual"
    ? Number(area.measurements.manualWetWallArea) || 0
    : measuredWallArea;

  const floorArea =
    Number(area.measurements.floor.length) * Number(area.measurements.floor.width);

  const dryTileExtensions = Array.isArray(area.dryTileExtensions) ? area.dryTileExtensions : [];
  const dryTileArea = dryTileExtensions.reduce((total, item) => {
    return total + (Number(item.area) || 0);
  }, 0);

  const wallWaste = Number(area.options?.wallWaste) || 0;
  const floorWaste = Number(area.options?.floorWaste) || 0;

  const niche = !!area.options?.niche;
  const bench = !!area.options?.bench;
  const curb = !!area.options?.curb;

  const nicheType = area.options?.nicheType || "inplace";
  const benchType = area.options?.benchType || "inplace";
  const curbType = area.options?.curbType || "inplace";

  const nichePrepArea = niche && nicheType === "inplace"
    ? (Number(area.options?.nichePrepArea) || 0)
    : 0;

  const benchPrepArea = bench && benchType === "inplace"
    ? (Number(area.options?.benchPrepArea) || 0)
    : 0;

  const curbPrepArea = curb && curbType === "inplace"
    ? (Number(area.options?.curbPrepArea) || 0)
    : 0;

  const prefabNicheUnits = niche && nicheType === "prefab" ? 1 : 0;
  const prefabBenchUnits = bench && benchType === "prefab" ? 1 : 0;
  const prefabCurbUnits = curb && curbType === "prefab" ? 1 : 0;

  const wetExtrasArea = nichePrepArea + benchPrepArea + curbPrepArea;
  const prepWallArea = wallArea + wetExtrasArea;
  const installWallArea = wallArea + dryTileArea;

  const wallAreaWithWaste = applyWaste(installWallArea, wallWaste);
  const floorAreaWithWaste = applyWaste(floorArea, floorWaste);

  const wallTrowel = area.options?.wallTrowel || "1/4x3/8";
  const floorTrowel = area.options?.floorTrowel || "1/2x1/2";

  const wallThinsetBags = wallAreaWithWaste > 0
    ? Math.ceil(wallAreaWithWaste / (THINSET_COVERAGE[wallTrowel] || 75))
    : 0;

  let floorThinsetBags = floorAreaWithWaste > 0
    ? Math.ceil(floorAreaWithWaste / (THINSET_COVERAGE[floorTrowel] || 45))
    : 0;

  const panType = area.options?.panType || "mud";
  const mudBedDepthIn = Number(area.options?.mudBedDepthIn) || 2;

  const mudBedVolumeCuFt =
    Number(area.measurements.floor.length) *
    Number(area.measurements.floor.width) *
    (mudBedDepthIn / 12);

  let mudBedBags = 0;
  let foamPanUnits = 0;
  let prefabPanUnits = 0;

  if (panType === "mud") {
    mudBedBags = mudBedVolumeCuFt > 0
      ? Math.ceil(mudBedVolumeCuFt / MUDBED_BAG_YIELD_CUFT)
      : 0;
  }

  if (panType === "foam" && floorArea > 0) {
    foamPanUnits = 1;
  }

  if (panType === "prefab" && floorArea > 0) {
    prefabPanUnits = 1;
  }

  const boardSize = Number(area.options?.boardSize) || 15;
  const boardType = area.options?.boardType || "kerdi";
  const waterproofType = area.options?.waterproofType || "foam";

  const boardsNeeded = prepWallArea > 0
    ? Math.ceil(prepWallArea / boardSize)
    : 0;

  const waterproofArea = prepWallArea + floorArea;
  const showerFloorMembraneArea = panType === "mud" ? floorArea : 0;

  let prepThinsetBags = 0;

  if (boardType === "goboard" || boardType === "kerdi") {
    prepThinsetBags = 0.5;

    if (floorArea > 0) {
      floorThinsetBags = 0.5;
    }
  }

  if (boardType === "durock" || boardType === "hardie") {
    prepThinsetBags = 1;
  }

  let foamBoardScrews = 0;
  let foamBoardWashers = 0;
  let cementBoardScrews = 0;
  let bandRolls = 0;
  let meshTapeRolls = 0;
  let sealantTubes = 0;

  if (boardType === "goboard" || boardType === "kerdi") {
    foamBoardScrews = boardsNeeded * 15;
    foamBoardWashers = boardsNeeded * 15;
  }

  if (boardType === "durock" || boardType === "hardie") {
    cementBoardScrews = boardsNeeded * 18;
  }

  if (waterproofType === "sheet") {
    bandRolls = prepWallArea > 0 ? Math.ceil(prepWallArea / 75) : 0;
    sealantTubes = Math.max(1, Math.ceil(boardsNeeded / 4));
  }

  if (waterproofType === "liquid") {
    meshTapeRolls = prepWallArea > 0 ? Math.ceil(prepWallArea / 100) : 0;
  }

  if (boardType === "kerdi" && waterproofType === "foam") {
    bandRolls = prepWallArea > 0 ? Math.ceil(prepWallArea / 75) : 0;
    sealantTubes = Math.max(1, Math.ceil(boardsNeeded / 4));
  }

  return {
    prep: {
      boardsNeeded,
      boardType,
      boardSize,
      waterproofType,
      waterproofArea,
      showerFloorMembraneArea,
      prepThinsetBags,
      mudBedBags,
      foamPanUnits,
      prefabPanUnits,
      panType,
      drains: floorArea > 0 ? 1 : 0,
      grates: floorArea > 0 ? 1 : 0,
      niche: niche ? 1 : 0,
      bench: bench ? 1 : 0,
      curb: curb ? 1 : 0,
      prefabNicheUnits,
      prefabBenchUnits,
      prefabCurbUnits,
      foamBoardScrews,
      foamBoardWashers,
      cementBoardScrews,
      bandRolls,
      meshTapeRolls,
      sealantTubes
    },
    install: {
      wallThinsetBags,
      floorThinsetBags
    },
    derived: {
      wallArea,
      floorArea,
      dryTileArea,
      installWallArea,
      prepWallArea,
      wetExtrasArea,
      wallAreaWithWaste,
      floorAreaWithWaste,
      wallWaste,
      floorWaste,
      wallTrowel,
      floorTrowel,
      nicheType,
      benchType,
      curbType,
      panType,
      mudBedDepthIn,
      mudBedVolumeCuFt
    }
  };
}

function calculateFloorMaterials(area) {
  const floorArea =
    Number(area.measurements.length) * Number(area.measurements.width);

  const floorWaste = Number(area.options?.floorWaste) || 0;
  const floorAreaWithWaste = applyWaste(floorArea, floorWaste);

  const floorType = area.options?.floorType || "tile";
  const floorTrowel = area.options?.floorTrowel || "1/2x1/2";

  const prepSystem = area.options?.prepSystem || "none";
  const useLeveler = !!area.options?.useLeveler;
  const levelerDepth = Number(area.options?.levelerDepth) || 0.25;

  const laminateUnderlayment = !!area.options?.laminateUnderlayment;
  const laminateVaporBarrier = !!area.options?.laminateVaporBarrier;

  const woodInstallMethod = area.options?.woodInstallMethod || "nail";
  const woodGlueTrowel = area.options?.woodGlueTrowel || "1/4-v-notch";
  const woodUnderlayment = !!area.options?.woodUnderlayment;
  const woodMoistureBarrier = !!area.options?.woodMoistureBarrier;
  const woodSoundBarrier = !!area.options?.woodSoundBarrier;

  let thinsetBags = 0;
  let ditraArea = 0;
  let durockBoards = 0;
  let levelerBags = 0;
  let prepThinsetBags = 0;

  let laminateUnderlaymentArea = 0;
  let laminateVaporBarrierArea = 0;

  let woodUnderlaymentArea = 0;
  let woodMoistureBarrierArea = 0;
  let woodSoundBarrierArea = 0;
  let woodGlueUnits = 0;
  let woodNailBoxes = 0;

  if (floorType === "tile") {
    thinsetBags = floorAreaWithWaste > 0
      ? Math.ceil(floorAreaWithWaste / (THINSET_COVERAGE[floorTrowel] || 45))
      : 0;

    if (prepSystem === "ditra") {
      ditraArea = floorArea;
      prepThinsetBags = Math.ceil(floorArea / 90);
    }

    if (prepSystem === "durock") {
      durockBoards = Math.ceil(floorArea / 15);
      prepThinsetBags = Math.ceil(floorArea / 90);
    }
  }

  if (floorType === "laminate") {
    if (laminateUnderlayment) {
      laminateUnderlaymentArea = floorArea;
    }

    if (laminateVaporBarrier) {
      laminateVaporBarrierArea = floorArea;
    }
  }

  if (floorType === "wood") {
    if (woodInstallMethod === "nail") {
      if (woodUnderlayment) {
        woodUnderlaymentArea = floorArea;
      }

      if (woodMoistureBarrier) {
        woodMoistureBarrierArea = floorArea;
      }

      if (woodSoundBarrier) {
        woodSoundBarrierArea = floorArea;
      }

      woodNailBoxes = floorArea > 0
        ? Math.max(1, Math.ceil(floorArea / 500))
        : 0;
    }

    if (woodInstallMethod === "glue") {
      let glueCoverage = 50;

      if (woodGlueTrowel === "3/16-v-notch") {
        glueCoverage = 100;
      }

      if (woodGlueTrowel === "1/4-v-notch") {
        glueCoverage = 50;
      }

      woodGlueUnits = floorAreaWithWaste > 0
        ? Math.ceil(floorAreaWithWaste / glueCoverage)
        : 0;
    }
  }

  if (useLeveler) {
    levelerBags = Math.ceil((floorArea * (levelerDepth / 0.25)) / 24);
  }

  return {
    prep: {
      floorType,
      prepSystem,
      ditraArea,
      durockBoards,
      levelerBags,
      prepThinsetBags,

      laminateUnderlaymentArea,
      laminateVaporBarrierArea,

      woodInstallMethod,
      woodGlueTrowel,
      woodUnderlaymentArea,
      woodMoistureBarrierArea,
      woodSoundBarrierArea,
      woodGlueUnits,
      woodNailBoxes
    },
    install: {
      thinsetBags
    },
    derived: {
      floorArea,
      floorAreaWithWaste,
      floorWaste,
      floorTrowel,
      levelerDepth,
      useLeveler
    }
  };
}

function calculateBacksplashMaterials(area) {
  const backsplashArea = Number(area.measurements.area) || 0;
  const backsplashWaste = Number(area.options?.backsplashWaste) || 0;
  const areaWithWaste = applyWaste(backsplashArea, backsplashWaste);

  const trowel = area.options?.backsplashTrowel || "1/4x3/16";
const masticType = area.options?.masticType || "1gal";
const coverage = MASTIC_COVERAGE[trowel]?.[masticType] || 35;

  const masticNeeded = areaWithWaste > 0
    ? Math.ceil(areaWithWaste / coverage)
    : 0;

  return {
    prep: {},
    install: {
      mastic1Gal: masticNeeded
    },
    derived: {
      backsplashArea,
      areaWithWaste,
      backsplashWaste
    }
  };
}

function calculateFireplaceMaterials(area) {
  const tileArea = Number(area.measurements.tileArea) || 0;
  const durockPrepArea = Number(area.measurements.durockPrepArea) || 0;

  const fireplaceWaste = Number(area.options?.fireplaceWaste) || 0;
  const fireplaceTrowel = area.options?.fireplaceTrowel || "1/4x3/8";

  const tileAreaWithWaste = applyWaste(tileArea, fireplaceWaste);

  const thinsetBags = tileAreaWithWaste > 0
    ? Math.ceil(tileAreaWithWaste / (THINSET_COVERAGE[fireplaceTrowel] || 75))
    : 0;

  const durockBoards = durockPrepArea > 0
    ? Math.ceil(durockPrepArea / 15)
    : 0;

  const meshTapeRolls = durockPrepArea > 0 ? 1 : 0;

  return {
    prep: {
      durockPrepArea,
      durockBoards,
      meshTapeRolls
    },
    install: {
      thinsetBags
    },
    derived: {
      tileArea,
      tileAreaWithWaste,
      fireplaceWaste,
      fireplaceTrowel
    }
  };
}

function calculateAreaMaterials(area) {
  if (!area) {
    return {
      prep: {},
      install: {},
      derived: {}
    };
  }

  if (area.type === "shower") {
    return calculateShowerMaterials(area);
  }

  if (area.type === "floor") {
    return calculateFloorMaterials(area);
  }

  if (area.type === "backsplash") {
    return calculateBacksplashMaterials(area);
  }

  if (area.type === "fireplace") return calculateFireplaceMaterials(area);

  if (area.type === "stairs") {
  return {
    prep: {},
    install: {},
    derived: {}
  };
}

  return {
    prep: {},
    install: {},
    derived: {}
  };
}
