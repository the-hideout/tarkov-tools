import fetch from 'cross-fetch';

import APIQuery from '../../modules/api-query.mjs';
import fleaMarketFee from '../../modules/flea-market-fee.mjs';

class ItemsQuery extends APIQuery {
    constructor() {
        super('items');
    }

    async query(options) {
        const { language, gameMode, prebuild } = options;
        const itemLimit = 20000;
        const QueryBody = (offset) => {
            return `query TarkovDevItems {
                items(lang: ${language}, gameMode: ${gameMode}, limit: ${itemLimit}, offset: ${offset}) {
                    id
                    bsgCategoryId
                    categories {
                        id
                        name
                        normalizedName
                    }
                    name
                    shortName
                    basePrice
                    normalizedName
                    backgroundColor
                    types
                    width
                    height
                    weight
                    avg24hPrice
                    wikiLink
                    changeLast48h
                    changeLast48hPercent
                    low24hPrice
                    high24hPrice
                    lastLowPrice
                    lastOfferCount
                    iconLink
                    baseImageLink
                    image512pxLink
                    image8xLink
                    inspectImageLink      
                    updated
                    sellFor {
                        ...ItemPriceFragment
                    }
                    buyFor {
                        ...ItemPriceFragment
                    }
                    containsItems {
                        count
                        item {
                            id
                        }
                    }
                    properties {
                        __typename
                        ...on ItemPropertiesAmmo {
                            caliber
                            damage
                            projectileCount
                            penetrationPower
                            armorDamage
                            fragmentationChance
                            ammoType
                        }
                        ...on ItemPropertiesArmor {
                            class
                            material {
                                id
                                name
                            }
                            zones
                            durability
                            ergoPenalty
                            speedPenalty
                            turnPenalty
                            armorSlots {
                                ...ArmorSlotFragment
                            }
                        }
                        ...on ItemPropertiesArmorAttachment {
                            class
                            material {
                                id
                                name
                            }
                            zones
                            durability
                            ergoPenalty
                            speedPenalty
                            turnPenalty
                        }
                        ...on ItemPropertiesBackpack {
                            capacity
                            grids {
                                ...GridFragment
                            }
                            speedPenalty
                            turnPenalty
                            ergoPenalty
                        }
                        ...on ItemPropertiesBarrel {
                            ergonomics
                            recoilModifier
                            slots {
                                ...SlotFragment
                            }
                        }
                        ...on ItemPropertiesChestRig {
                            capacity
                            class
                            material {
                                id
                                name
                            }
                            zones
                            durability
                            ergoPenalty
                            speedPenalty
                            turnPenalty
                            grids {
                                ...GridFragment
                            }
                            armorSlots {
                                ...ArmorSlotFragment
                            }
                        }
                        ...on ItemPropertiesContainer {
                            capacity
                            grids {
                                ...GridFragment
                            }
                        }
                        ...on ItemPropertiesFoodDrink {
                            energy
                            hydration
                            units
                            stimEffects {
                                ...StimEffectFragment
                            }
                        }
                        ...on ItemPropertiesGlasses {
                            class
                            durability
                            blindnessProtection
                            material {
                                id
                                name
                            }
                        }
                        ...on ItemPropertiesGrenade {
                            type
                            fuse
                            maxExplosionDistance
                            fragments
                        }
                        ...on ItemPropertiesHeadphone {
                            ambientVolume
                            distortion
                            distanceModifier
                        }
                        ...on ItemPropertiesHelmet {
                            class
                            material {
                                id
                                name
                            }
                            headZones
                            durability
                            ergoPenalty
                            speedPenalty
                            turnPenalty
                            deafening
                            blocksHeadset
                            ricochetY
                            slots {
                                ...SlotFragment
                            }
                        }
                        ...on ItemPropertiesKey {
                            uses
                        }
                        ...on ItemPropertiesMagazine {
                            capacity
                            malfunctionChance
                            ergonomics
                            recoilModifier
                            capacity
                            loadModifier
                            ammoCheckModifier
                        }
                        ...on ItemPropertiesMedicalItem {
                            uses
                            useTime
                            cures
                        }
                        ...on ItemPropertiesMedKit {
                            hitpoints
                            useTime
                            maxHealPerUse
                            cures
                            hpCostLightBleeding
                            hpCostHeavyBleeding
                        }
                        ...on ItemPropertiesPainkiller {
                            uses
                            useTime
                            cures
                            painkillerDuration
                            energyImpact
                            hydrationImpact
                        }
                        ...on ItemPropertiesPreset {
                            baseItem {
                                id
                                name
                                normalizedName
                                properties {
                                    ...on ItemPropertiesWeapon {
                                        defaultPreset {
                                            id
                                        }
                                    }
                                }
                            }
                            ergonomics
                            recoilVertical
                            recoilHorizontal
                        }
                        ...on ItemPropertiesResource {
                            units
                        }
                        ...on ItemPropertiesScope {
                            ergonomics
                            recoilModifier
                            zoomLevels
                        }
                        ...on ItemPropertiesStim {
                            cures
                            useTime
                            stimEffects {
                                ...StimEffectFragment
                            }
                        }
                        ...on ItemPropertiesSurgicalKit {
                            uses
                            useTime
                            cures
                            minLimbHealth
                            maxLimbHealth
                        }
                        ...on ItemPropertiesWeapon {
                            caliber
                            effectiveDistance
                            ergonomics
                            fireModes
                            fireRate
                            recoilVertical
                            recoilHorizontal
                            sightingRange
                            recoilAngle
                            recoilDispersion
                            convergence
                            cameraRecoil
                            slots {
                                ...SlotFragment
                            }
                            defaultPreset {
                                id
                            }
                            presets {
                                id
                            }
                        }
                        ...on ItemPropertiesWeaponMod {
                            ergonomics
                            recoilModifier
                            slots {
                                ...SlotFragment
                            }
                        }
                    }
                }
            }
            fragment GridFragment on ItemStorageGrid {
                width
                height
                filters {
                    allowedCategories {
                        id
                    }
                    allowedItems {
                        id
                    }
                    excludedCategories {
                        id
                    }
                    excludedItems {
                        id
                    }
                }
            }
            fragment SlotFragment on ItemSlot {
                filters {
                    allowedCategories {
                        id
                    }
                    allowedItems {
                        id
                    }
                    excludedCategories {
                        id
                    }
                    excludedItems {
                        id
                    }
                }
            }
            fragment SoftArmorSlotFragment on ItemArmorSlotLocked {
                nameId
                name
                class
                durability
                speedPenalty
                turnPenalty
                ergoPenalty
                material {
                    id
                    name
                }
                zones
                armorType
            }
            fragment PlateArmorSlotFragment on ItemArmorSlotOpen {
                nameId
                name
                zones
                allowedPlates {
                    id
                }
            }
            fragment ArmorSlotFragment on ItemArmorSlot {
                nameId
                zones
                ...on ItemArmorSlotLocked {
                    ...SoftArmorSlotFragment
                }
                ...on ItemArmorSlotOpen {
                    ...PlateArmorSlotFragment
                }
            }
            fragment ItemPriceFragment on ItemPrice {
                vendor {
                    name
                    normalizedName
                    __typename
                    ...on TraderOffer {
                        trader {
                            id
                        }
                        minTraderLevel
                        taskUnlock {
                            id
                            tarkovDataId
                            name
                            normalizedName
                        }
                    }
                }
                price
                currency
                priceRUB
                requirements {
                    type
                    value
                }
            }
            fragment StimEffectFragment on StimEffect {
                type
                chance
                delay
                duration
                value
                percent
                skillName
            }`;
        };
        //console.time('items query');
        const [itemData, miscData, itemGrids] = await Promise.all([
            new Promise(async (resolve, reject) => {
                let offset = 0;
                const retrievedItems = {
                    data: {
                        items: [],
                    },
                    errors: [],
                };
                while (true) {
                    const query = QueryBody(offset).replace(/\s{2,}/g, ' ');
                    const itemBatch = await this.graphqlRequest(query).catch(reject);
                    if (!itemBatch) {
                        break;
                    }
                    if (itemBatch.errors) {
                        retrievedItems.errors.concat(itemBatch.errors);
                    }
                    if (itemBatch.data && itemBatch.data.items) {
                        if (itemBatch.data.items.length === 0) {
                            break;
                        }
                        retrievedItems.data.items = retrievedItems.data.items.concat(
                            itemBatch.data.items,
                        );
                        if (itemBatch.data.items.length < itemLimit) {
                            break;
                        }
                    }
                    if (!itemBatch.errors) {
                        if (
                            !itemBatch.data ||
                            !itemBatch.data.items ||
                            !itemBatch.data.items.length
                        ) {
                            break;
                        }
                    }
                    offset += itemLimit;
                }
                if (retrievedItems.errors.length < 1) {
                    retrievedItems.errors = undefined;
                }
                resolve(retrievedItems);
            }),
            this.graphqlRequest(
                `{
                fleaMarket {
                    sellOfferFeeRate
                    sellRequirementFeeRate
                }
            }`.replace(/\s{2,}/g, ' '),
            ),
            new Promise((resolve) => {
                if (prebuild) {
                    return resolve({});
                }
                return resolve(
                    fetch(`${process.env.PUBLIC_URL}/data/item-grids.min.json`).then((response) =>
                        response.json(),
                    ),
                ).catch((error) => {
                    console.log('Error retrieving item grids', error);
                    return {};
                });
            }),
        ]);
        //console.timeEnd('items query');
        if (itemData.errors) {
            if (itemData.data) {
                for (const error of itemData.errors) {
                    let badItem = false;
                    if (error.path) {
                        let traverseLimit = 2;
                        if (error.path[0] === 'fleaMarket') {
                            traverseLimit = 1;
                        }
                        badItem = itemData.data;
                        for (let i = 0; i < traverseLimit; i++) {
                            badItem = badItem[error.path[i]];
                        }
                    }
                    console.log(`Error in items API query: ${error.message}`, error.path);
                    if (badItem) {
                        console.log(badItem);
                    }
                }
            }
            // only throw error if this is for prebuild or data wasn't returned
            if (prebuild || !itemData.data || !itemData.data.items || !itemData.data.items.length) {
                return Promise.reject(new Error(itemData.errors[0].message));
            }
        }

        if (miscData.errors) {
            if (miscData.data) {
                for (const error of miscData.errors) {
                    let badItem = false;
                    if (error.path) {
                        let traverseLimit = 2;
                        if (error.path[0] === 'fleaMarket') {
                            traverseLimit = 1;
                        }
                        badItem = miscData.data;
                        for (let i = 0; i < traverseLimit; i++) {
                            badItem = badItem[error.path[i]];
                        }
                    }
                    console.log(`Error in items API query: ${error.message}`, error.path);
                    if (badItem) {
                        console.log(badItem);
                    }
                }
            }
            // only throw error if this is for prebuild or data wasn't returned
            if (prebuild || !miscData.data || !miscData.data.fleaMarket) {
                return Promise.reject(new Error(miscData.errors[0].message));
            }
        }

        const flea = miscData.data.fleaMarket;

        const allItems = itemData.data.items.map((rawItem) => {
            // calculate grid
            let grid = null;
            if (rawItem.properties?.grids) {
                grid = {};

                let gridPockets = [];
                if (itemGrids[rawItem.id]) {
                    gridPockets = itemGrids[rawItem.id];
                } else if (rawItem.properties.grids.length === 1) {
                    gridPockets = [
                        {
                            row: 0,
                            col: 0,
                            width: rawItem.properties.grids[0].width,
                            height: rawItem.properties.grids[0].height,
                        },
                    ];
                }

                if (gridPockets.length > 1) {
                    grid.height = Math.max(
                        ...gridPockets.map((pocket) => pocket.row + pocket.height),
                    );
                    grid.width = Math.max(
                        ...gridPockets.map((pocket) => pocket.col + pocket.width),
                    );
                } else if (rawItem.properties.grids.length >= 1) {
                    grid.height = rawItem.properties.grids[0].height;
                    grid.width = rawItem.properties.grids[0].width;
                } else {
                    grid.height = rawItem.height;
                    grid.width = rawItem.width;
                }
                grid.pockets = gridPockets;
            }
            rawItem.grid = grid;

            rawItem.properties = {
                ...rawItem.properties,
            };

            // calculate flea market fee
            const fee = fleaMarketFee(
                rawItem.basePrice,
                rawItem.lastLowPrice,
                1,
                flea.sellOfferFeeRate,
                flea.sellRequirementFeeRate,
            );
            rawItem.fee = fee;

            const container = rawItem.properties?.slots || rawItem.properties?.grids;
            if (container) {
                for (const slot of container) {
                    slot.filters.allowedCategories = slot.filters.allowedCategories.map(
                        (cat) => cat.id,
                    );
                    slot.filters.allowedItems = slot.filters.allowedItems.map((it) => it.id);
                    slot.filters.excludedCategories = slot.filters.excludedCategories.map(
                        (cat) => cat.id,
                    );
                    slot.filters.excludedItems = slot.filters.excludedItems.map((it) => it.id);
                }
            }

            return rawItem;
        });

        return allItems;
    }
}

const itemsQuery = new ItemsQuery();

const doFetchItems = async (options) => {
    return itemsQuery.run(options);
};

export default doFetchItems;
