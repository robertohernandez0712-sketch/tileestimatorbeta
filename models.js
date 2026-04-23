function createId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function createProject() {
  return {
    projectId: createId("project"),
    projectName: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "draft",

    client: {
      name: "",
      phone: ""
    },

    jobSite: {
      address: ""
    },

    scopeOfWork: "",
    notes: "",

    charges: {
      demolition: {
        included: false,
        price: 0
      },
      plumbing: {
        included: false,
        price: 0
      }
    },

    tools: {
  groutCalculator: {
    area: 0,
    groutType: "non-sanded-10",
    tileSize: "12x12x3/8",
    jointWidth: "1/8"
  },
  layoutCalculator: {
    area: 0,
    tileWidth: 12,
    tileLength: 24,
    wastePercent: 10,
    piecesPerBox: 0,
    coveragePerBox: 0
  }
},

invoice: {
  number: "",
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  status: "draft",
  mode: "detailed",
  paymentTerms: "",
  notes: "",
  amountPaid: 0,
  payments: [],
  customItems: []
},

    evidenceLog: [],

    areas: []
  };
}

function createArea(type = "shower") {
  const baseArea = {
    areaId: createId("area"),
    type,
    name: "",
    pricing: {
      laborPricePerSqFt: 0
    },
    results: {
      pricing: {
        total: 0
      }
    }
  };

  if (type === "shower") {
  return {
    ...baseArea,
    name: "New Shower",
    measurements: {
      backWall: { width: 0, height: 0 },
      leftWall: { width: 0, height: 0 },
      rightWall: { width: 0, height: 0 },
      manualWetWallArea: 0,
      floor: { length: 0, width: 0 }
    },
    options: {
      showerMeasurementMode: "manual",
      wallWaste: 10,
      floorWaste: 10,
      wallTrowel: "1/4x3/8",
      floorTrowel: "1/2x1/2",
      boardType: "kerdi",
      boardSize: 15,
      waterproofType: "foam",
      panType: "mud",
      mudBedDepthIn: 2,
      niche: false,
      bench: false,
      curb: false,
      nicheType: "inplace",
      benchType: "inplace",
      curbType: "inplace",
      nichePrepArea: 6,
      benchPrepArea: 10,
      curbPrepArea: 5,
      nichePrice: 0,
      benchPrice: 0,
      curbPrice: 0
    },
    customTasks: [],
    dryTileExtensions: [],
    edgeFinishes: {
      metalTrimFt: 0,
      bullnoseFt: 0,
      quartzStoneCapFt: 0
    }
  };
}

if (type === "floor") {
  return {
    ...baseArea,
    name: "New Floor",
    measurements: {
      length: 0,
      width: 0
    },
    options: {
  floorType: "tile",
  floorWaste: 10,
  floorTrowel: "1/2x1/2",

  prepSystem: "none",
  useLeveler: false,
  levelerDepth: 0.25,

  laminateUnderlayment: true,
  laminateVaporBarrier: false,

  woodInstallMethod: "nail",
  woodGlueTrowel: "1/4-v-notch",
  woodUnderlayment: true,
  woodMoistureBarrier: true,
  woodSoundBarrier: false
},
    floorTasks: [],
    edgeFinishes: {
      metalTrimFt: 0,
      transitionsFt: 0
    }
  };
}

if (type === "backsplash") {
  return {
    ...baseArea,
    name: "New Backsplash",
    measurements: {
      area: 0
    },
    options: {
      backsplashWaste: 10,
      backsplashTrowel: "1/4x3/16",
      masticType: "1gal"
    },
    edgeFinishes: {
      metalTrimFt: 0,
      bullnoseFt: 0,
      quartzStoneCapFt: 0
    },
    backsplashTasks: []
  };
}

if (type === "fireplace") {
  return {
    ...baseArea,
    name: "New Fireplace",
    measurements: {
      tileArea: 0,
      durockPrepArea: 0
    },
    options: {
      fireplaceWaste: 10,
      fireplaceTrowel: "1/4x3/8"
    },
    edgeFinishes: {
      metalTrimFt: 0,
      bullnoseFt: 0,
      quartzStoneCapFt: 0
    },
    fireplaceTasks: []
  };
}

if (type === "stairs") {
  return {
    ...baseArea,
    name: "New Stairs",
    measurements: {
      steps: 0,
      landings: 0
    },
    pricing: {
      pricePerStep: 0,
      pricePerLanding: 0,
      laborPricePerSqFt: 0
    },
    stairTasks: []
  };
}

  return baseArea;
}
