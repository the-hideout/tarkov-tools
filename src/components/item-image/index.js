import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Link, useNavigate } from 'react-router-dom';
import ImageViewer from 'react-simple-image-viewer';
import { useTranslation } from 'react-i18next';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import ResizeObserver from 'resize-observer-polyfill';
import useResponsiveScaling from '../../hooks/useResponsiveScaling.jsx';

import './index.css';

const colors = {
    black: { r: 0, g: 0, b: 0, alpha: 77 / 255 },
    blue: { r: 28, g: 65, b: 86, alpha: 77 / 255 },
    default: { r: 127, g: 127, b: 127, alpha: 77 / 255 },
    green: { r: 21, g: 45, b: 0, alpha: 77 / 255 },
    grey: { r: 29, g: 29, b: 29, alpha: 77 / 255 },
    orange: { r: 60, g: 25, b: 0, alpha: 77 / 255 },
    red: { r: 109, g: 36, b: 24, alpha: 77 / 255 },
    violet: { r: 76, g: 42, b: 85, alpha: 77 / 255 },
    yellow: { r: 104, g: 102, b: 40, alpha: 77 / 255 },
};

function ItemImage({
    item,
    backgroundScale = 1,
    imageField = 'baseImageLink',
    nonFunctionalOverlay = false,
    imageViewer = false,
    children = '',
    attributes = [],
    count,
    isFIR = false,
    isTool = false,
    nonFunctional = false,
    linkToItem = false,
    fullNameTooltip = false,
    trader,
    station,
    className,
    style,
    imageStyle,
    maxImageWidth,
    maxImageHeight,
    responsive = false,
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const refContainer = useRef();
    /*const [containerDimensions, setDimensions] = useState({ width: 0, height: 0 });
    useEffect(() => {
        if (!refContainer.current) return;
        const resizeObserver = new ResizeObserver(() => {
            setDimensions({
                width: refContainer.current.offsetWidth,
                height: refContainer.current.offsetHeight,
            });
        });
        resizeObserver.observe(refContainer.current);
        return () => resizeObserver.disconnect();
    }, []);*/

    const refImage = useRef();
    const scaler = useResponsiveScaling();
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    useEffect(() => {
        if (!refImage.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            if (!refImage.current) {
                return;
            }
            if (
                refImage.current.width === imageDimensions.width &&
                refImage.current.height === imageDimensions.height
            ) {
                return;
            }
            setImageDimensions({
                width: refImage.current.width,
                height: refImage.current.height,
            });
        });
        const intersectionObserver = new IntersectionObserver((entries) => {
            if (!refImage.current) {
                return;
            }
            if (entries[0].isIntersecting) {
                resizeObserver.observe(refImage.current);
                intersectionObserver.disconnect();
            }
        });
        intersectionObserver.observe(refImage.current);
        return () => {
            intersectionObserver.disconnect();
            resizeObserver.disconnect();
        };
    }, [imageDimensions]);

    const loadingImage = useMemo(() => {
        if (!item.types?.includes('loading')) {
            return <></>;
        }
        const loadingStyle = {
            WebkitMask: `url(${item[imageField]}) center/cover`,
            mask: `url(${item[imageField]}) center/cover`,
        };

        return <div className="item-image-mask" style={loadingStyle}></div>;
    }, [item, imageField]);

    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const openImageViewer = useCallback(() => {
        if (!imageViewer) {
            return;
        }
        setIsViewerOpen(true);
    }, [imageViewer]);
    const closeImageViewer = () => {
        setIsViewerOpen(false);
    };
    const viewerBackgroundStyle = {
        backgroundColor: 'rgba(0,0,0,.9)',
        zIndex: 20,
        maxWidth: '100%',
        maxHeight: '100%',
    };

    const imageElement = useMemo(() => {
        const iStyle = {};
        if (item.types?.includes('loading')) {
            iStyle.display = 'none';
        }
        if (imageViewer) {
            iStyle.cursor = 'zoom-in';
        }
        //console.log(dimensions);
        if (responsive) {

        }
        if (responsive && maxImageWidth) {
            iStyle.maxWidth = maxImageWidth * scaler;
            //iStyle.height = maxImageHeight * scaler;
        }
        if (responsive && maxImageHeight) {
            iStyle.maxHeight = maxImageHeight * scaler;
        }

        const img = (
            <img
                ref={refImage}
                onClick={openImageViewer}
                src={item[imageField]}
                alt={item.name}
                loading="lazy"
                style={{...iStyle, ...imageStyle}}
            />
        );
        if (linkToItem && !item.types.includes('quest')) {
            return <Link to={`/item/${item.normalizedName}`}>{img}</Link>;
        }
        return img;
    }, [item, refImage, imageField, openImageViewer, imageViewer, linkToItem, imageStyle, responsive, scaler, maxImageWidth, maxImageHeight]);

    const imageScale = useMemo(() => {
        const w = imageDimensions.width || item.width * 63 + 1;
        return w / (item.width * 63 + 1);
    }, [imageDimensions, item]);

    const textSize = useMemo(() => {
        return Math.min(12 * imageScale, 16);
    }, [imageScale]);

    const { colorString, gridPercentX, gridPercentY } = useMemo(() => {
        const color = colors[item.backgroundColor];
        return {
            colorString: `${color.r}, ${color.g}, ${color.b}, ${color.alpha}`,
            gridPercentX: (1 / item.width) * 100,
            gridPercentY: (1 / item.height) * 100,
        };
    }, [item]);

    const nonFunctionalElement = useMemo(() => {
        if (
            !nonFunctionalOverlay ||
            !item.types.includes('gun') ||
            !item.properties?.defaultPreset
        ) {
            return <></>;
        }
        const nonFunctionalStyle = {
            position: 'absolute',
            boxSizing: 'border-box',
            top: `${1 * backgroundScale}px`,
            left: `${1 * backgroundScale}px`,
            height: `calc(100% - ${2 * backgroundScale}px)`,
            width: `calc(100% - ${2 * backgroundScale}px)`,
            fallbacks: [
                { width: `-webkit-calc(100% - ${2 * backgroundScale}px)` },
                { width: `-moz-calc(100% - ${2 * backgroundScale}px)` },
                { height: `-webkit-calc(100% - ${2 * backgroundScale}px)` },
                { height: `-moz-calc(100% - ${2 * backgroundScale}px)` },
            ],
            backgroundColor: '#4400004f',
        };
        if (imageViewer) {
            nonFunctionalStyle.cursor = 'zoom-in';
        }
        return (
            <div
                className="item-nonfunctional-mask"
                onClick={openImageViewer}
                style={nonFunctionalStyle}
            />
        );
    }, [item, nonFunctionalOverlay, backgroundScale, openImageViewer, imageViewer]);

    const toolOverride = useMemo(() => {
        return isTool || attributes?.some((att) => att.name === 'tool');
    }, [attributes, isTool]);

    const borderColor = useMemo(() => {
        let color = 'rgb(73, 81, 84)';
        if (toolOverride) {
            color = '#0292c0';
        }
        if (item.types.includes('gun')) {
            if (nonFunctional) {
                color = '#c00802';
            }
        }
        return color;
    }, [item, toolOverride, nonFunctional]);
    const backgroundStyle = useMemo(() => {
        if (imageField === 'iconLink') {
            const iconStyle = {
                position: 'relative',
                maxHeight: `${imageDimensions.height || 64}px`,
                maxWidth: `${imageDimensions.width || 64}px`,
            };
            if (toolOverride || nonFunctional) {
                iconStyle.outline = `1px solid ${borderColor}`;
                iconStyle.outlineOffset = `-1px`;
            }
            return iconStyle;
        }
        let sizeFactor = 1;
        if (imageField === 'image512pxLink') {
            sizeFactor = 512 / (item.width * 63 + 1);
            if (item.height > item.width) {
                sizeFactor = 512 / (item.height * 63 + 1);
            }
        }
        if (imageField === 'image8xLink') {
            sizeFactor = 8;
        }
        if (imageField === 'inspectImageLink' && responsive) {
            const loadOutImgStyle = {
                maxHeight: `${(maxImageHeight || imageDimensions.height) * scaler}px`,
                maxWidth: `${(maxImageWidth || imageDimensions.width) * scaler}px`,
                position: 'relative',
            };
            return loadOutImgStyle;
        }
        let width = imageDimensions.width || (item.width * 63 + 1) * sizeFactor;
        let height = imageDimensions.height || (item.height * 63 + 1) * sizeFactor;
        /*if (responsive) {
            width = width * scaler;
            height = height * scaler;
        }*/
        const gridSvg = () => (
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <defs>
                    <pattern
                        id="smallChecks"
                        width={2 * backgroundScale}
                        height={2 * backgroundScale}
                        patternUnits="userSpaceOnUse"
                    >
                        <rect
                            x="0"
                            y="0"
                            width={1 * backgroundScale}
                            height={1 * backgroundScale}
                            style={{ fill: 'rgba(29, 29, 29, .62)' }}
                        />
                        <rect
                            x="0"
                            y={1 * backgroundScale}
                            width={1 * backgroundScale}
                            height={1 * backgroundScale}
                            style={{ fill: 'rgba(44, 44, 44, .62)' }}
                        />
                        <rect
                            x={1 * backgroundScale}
                            y="0"
                            width={1 * backgroundScale}
                            height={1 * backgroundScale}
                            style={{ fill: 'rgba(44, 44, 44, .62)' }}
                        />
                        <rect
                            x={1 * backgroundScale}
                            y={1 * backgroundScale}
                            width={1 * backgroundScale}
                            height={1 * backgroundScale}
                            style={{ fill: 'rgba(29, 29, 29, .62)' }}
                        />
                    </pattern>
                    <pattern id="gridCell" width="100%" height="100%" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="100%" height="100%" fill="url(#smallChecks)" />
                        <line
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="100%"
                            stroke="rgba(50, 50, 50, .75)"
                            strokeWidth={`${2 * backgroundScale}`}
                        />
                        <line
                            x1="0"
                            x2="100%"
                            y1="0"
                            y2="0"
                            stroke="rgba(50, 50, 50, .75)"
                            strokeWidth={`${2 * backgroundScale}`}
                        />
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            style={{ fill: `rgba(${colorString})` }}
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="#000" />
                <rect width="100%" height="100%" fill="url(#gridCell)" />
            </svg>
        );
        const backgroundStyle = {
            backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(renderToStaticMarkup(gridSvg()))}')`,
            backgroundSize: `${gridPercentX}% ${gridPercentY}%`,
            position: 'relative',
            outline: `${1 * backgroundScale}px solid ${borderColor}`,
            outlineOffset: `-${1 * backgroundScale}px`,
            maxHeight: `${height}px`,
            maxWidth: `${width}px`,
        };
        return backgroundStyle;
    }, [
        backgroundScale,
        borderColor,
        colorString,
        imageField,
        gridPercentX,
        gridPercentY,
        item,
        imageDimensions,
        toolOverride,
        nonFunctional,
        scaler,
        maxImageWidth,
        maxImageHeight,
        responsive,
    ]);

    const imageTextStyle = useMemo(() => {
        if (imageField === 'iconLink' || item.types.includes('loading')) {
            return { display: 'none' };
        }
        const style = {
            position: 'absolute',
            top: `${Math.min(backgroundScale + imageScale, 4)}px`,
            right: `${Math.min(backgroundScale + 1.5 * imageScale, 7)}px`,
            cursor: 'default',
            color: '#a4aeb4',
            fontWeight: 'bold',
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
            fontSize: `${textSize}px`,
            textAlign: 'right',
        };
        if (linkToItem) {
            style.cursor = 'pointer';
        }
        if (responsive) {
            //style.fontSize = `${Math.min(26 * scaler, 12)}px`;
        }
        return style;
    }, [imageField, imageScale, textSize, backgroundScale, item, linkToItem, responsive]);

    const imageTextClick = useMemo(() => {
        if (!linkToItem) {
            return () => {};
        }
        return () => {
            navigate(`/item/${item.normalizedName}`);
        };
    }, [item, linkToItem, navigate]);

    const imageText = useMemo(() => {
        let element = (
            <div style={imageTextStyle} onClick={imageTextClick}>
                {item.shortName}
            </div>
        );
        if (fullNameTooltip && imageTextStyle.display !== 'none') {
            element = <Tippy content={item.name}>{element}</Tippy>;
        }
        return element;
    }, [fullNameTooltip, imageTextClick, imageTextStyle, item]);

    const itemExtraStyle = {
        position: 'absolute',
        bottom: `${backgroundScale}px`,
        right: `${backgroundScale}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
    };

    const traderElementStyle = useMemo(() => {
        let scale = 24;
        if (item.width > 1 && item.height > 1) {
            scale = 48;
        }
        return {
            position: 'absolute',
            bottom: `${backgroundScale}px`,
            left: `${backgroundScale}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            maxWidth: `${scale * imageScale}px`,
            maxHeight: `${scale * imageScale}px`,
        };
    }, [backgroundScale, imageScale, item]);

    const traderImageStyle = useMemo(() => {
        let scale = 24;
        if (item.width > 1 && item.height > 1) {
            scale = 48;
        }
        return {
            maxWidth: `${scale * imageScale}px`,
            maxHeight: `${scale * imageScale}px`,
        };
    }, [imageScale, item]);

    return (
        <div ref={refContainer} style={{ ...backgroundStyle, ...style }} className={className}>
            {loadingImage}
            {imageElement}
            {nonFunctionalElement}
            {imageText}
            <div style={itemExtraStyle}>
                {isFIR && (
                    <Tippy placement="bottom" content={t('Found In Raid')}>
                        <img
                            alt=""
                            className="item-image-fir"
                            loading="lazy"
                            src={`${process.env.PUBLIC_URL}/images/icon-fir.png`}
                        />
                    </Tippy>
                )}
                {count && <span className="item-image-count">{count}</span>}
            </div>
            {trader && (
                <div style={traderElementStyle}>
                    <Tippy placement="top" content={trader.name}>
                        <Link to={`/trader/${trader.normalizedName}`}>
                            <img
                                alt={trader.name}
                                src={`/images/traders/${trader.normalizedName}-icon.jpg`}
                                style={traderImageStyle}
                            />
                        </Link>
                    </Tippy>
                </div>
            )}
            {station && (
                <div style={traderElementStyle}>
                    <Tippy placement="top" content={station.name}>
                        <Link
                            to={`/hideout-profit/?station=${station.normalizedName}&all=true&search=${item.name}`}
                        >
                            <img
                                alt={station.name}
                                src={station.imageLink}
                                style={traderImageStyle}
                            />
                        </Link>
                    </Tippy>
                </div>
            )}
            {children}
            {isViewerOpen && (
                <ImageViewer
                    src={[item.image8xLink]}
                    currentIndex={0}
                    backgroundStyle={viewerBackgroundStyle}
                    disableScroll={true}
                    closeOnClickOutside={true}
                    onClose={closeImageViewer}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                    }}
                />
            )}
        </div>
    );
}

export default ItemImage;
