var cwbcloudoptions = [
    {
        name: "彩色",
        display: "彩色",
        items: [
            { name: "彩色(台灣)", display: "台灣", url: "https://www.cwb.gov.tw/Data/satellite/TWI_IR1_CR_800/TWI_IR1_CR_800-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", xmin: 116.02, ymin: 19.13, xmax: 125.98, ymax: 28.11, frequency: 10, minIcon: "Scripts/gis/ext/cloud/彩色.jpg" },
            { name: "彩色(東亞)", display: "東亞", url: "https://www.cwb.gov.tw/Data/satellite/LCC_IR1_CR_2750/LCC_IR1_CR_2750-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", ymax: 46.76, ymin: -0.42, xmax: 145.19, xmin: 94, frequency: 10, minIcon: "Scripts/gis/ext/cloud/彩色.jpg" }
        ]
    },
    {
        name: "可見光",
        display: "可見光",
        items: [
            { name: "可見光(台灣)", display: "台灣", url: "https://www.cwb.gov.tw/Data/satellite/TWI_VIS_Gray_1350/TWI_VIS_Gray_1350-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", xmin: 116.02, ymin: 19.13, xmax: 125.98, ymax: 28.11, frequency: 10, minIcon: "Scripts/gis/ext/cloud/可見光.jpg" },
            { name: "可見光(東亞)", display: "東亞", url: "https://www.cwb.gov.tw/Data/satellite/LCC_VIS_Gray_2750/LCC_VIS_Gray_2750-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", ymax: 46.76, ymin: -0.42, xmax: 145.19, xmin: 94, frequency: 10, minIcon: "Scripts/gis/ext/cloud/可見光.jpg" }
        ]
    },
    {
        name: "色調強化",
        display: "色調強化",
        items: [
            { name: "色調強化(台灣)", display: "台灣", url: "https://www.cwb.gov.tw/Data/satellite/TWI_IR1_MB_800/TWI_IR1_MB_800-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", xmin: 116.02, ymin: 19.13, xmax: 125.98, ymax: 28.11, frequency: 10, minIcon: "Scripts/gis/ext/cloud/色調強化(紅外線).jpg" },
            { name: "色調強化(東亞)", display: "東亞", url: "https://www.cwb.gov.tw/Data/satellite/LCC_IR1_MB_2750/LCC_IR1_MB_2750-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", ymax: 46.76, ymin: -0.42, xmax: 145.19, xmin: 94, frequency: 10, minIcon: "Scripts/gis/ext/cloud/色調強化(紅外線).jpg" }
        ]
    },
    {
        name: "雷達回波",
        display: "雷達回波",
        items: [
            //{ name: "雷達回波", display: "雷達回波", url: "http://210.69.20.18/cwbhis/{Y}/{M}/{dd}/GRad/{HH}{mm}_MOS0.jpg", xmin: 117.2784, ymin: 19.6084, xmax: 124.8590, ymax: 27.1284, frequency: 30, minIcon: "http://www.cwb.gov.tw/V7/images/observe/radar/MOS.jpg" }
            { name: "雷達回波", display: "雷達回波", url: "https://www.cwb.gov.tw/Data/radar/CV1_TW_3600_{Y}{MM}{dd}{HH}{mm}.png", ymax: 26.45, ymin: 20.48, xmax: 123.98, xmin: 118.01, frequency: 10, minIcon: "Scripts/gis/ext/cloud/雷達迴波(無地形).jpg" },
            /*{ name: "高雄林園", display: "高雄林園", url: "https://www.cwb.gov.tw/Data/radar_rain/CV1_RCLY_3600/CV1_RCLY_3600_20210217110659.png", "xmin": 118.92, "ymin": 21.16, "xmax": 121.84, "ymax": 23.88, frequency: 10, minIcon: "Scripts/gis/ext/cloud/雷達迴波(無地形).jpg" }*/
        ]
    },
    {
        name: "累積雨量",
        display: "累積雨量",
        items: [
            //以下是中央氣象局V8版資料來源
            { name: "今日累積", "display": "今日", "url": "https://www.cwb.gov.tw/Data/rainfall/{Y}-{MM}-{dd}_{HH}{mm}.QZJ8.jpg", "xmin": 119.17, "ymin": 21.48, "xmax": 123.64, "ymax": 25.95, "frequency": 30, minIcon: "Scripts/gis/ext/cloud/累計雨量.jpg" },
            { name: "昨日累積", "display": "昨日", "url": "https://www.cwb.gov.tw/Data/rainfall/{Y}-{MM}-{dd}_0000.QZJ8.jpg", "xmin": 119.17, "ymin": 21.48, "xmax": 123.64, "ymax": 25.95, "frequency": 30, minIcon: "Scripts/gis/ext/cloud/累計雨量.jpg" },
            { name: "前日累積", "display": "前日", "url": "https://www.cwb.gov.tw/Data/rainfall/{Y}-{MM}-{dd}_0000.QZJ8.jpg", "xmin": 119.17, "ymin": 21.48, "xmax": 123.64, "ymax": 25.95, "frequency": 30, minIcon: "Scripts/gis/ext/cloud/累計雨量.jpg" },
        ]
    },
    {
        name: "12小時定量降水預報",
        display: "12小時定量降水預報",
        items: [
            { name: "12-12小時", display: "I", url: "https://www.cwb.gov.tw/Data/fcst_img/QPF_ChFcstPrecip_12_12.png", "xmin": 118.94, "ymin": 21.8, "xmax": 122.45, "ymax": 25.79, frequency: 30, minIcon: "Scripts/gis/ext/cloud/定量降水.jpg" },
            { name: "12-24小時", display: "II", url: "https://www.cwb.gov.tw/Data/fcst_img/QPF_ChFcstPrecip_12_24.png", "xmin": 118.94, "ymin": 21.8, "xmax": 122.45, "ymax": 25.79, frequency: 30, minIcon: "Scripts/gis/ext/cloud/定量降水.jpg" }
        ]
    },
    {
        name: "6小時定量降水預報",
        display: "6小時定量降水預報",
        items: [
            { name: "6-6小時", display: "I", url: "https://www.cwb.gov.tw/Data/fcst_img/QPF_ChFcstPrecip_6_06.png", "xmin": 118.94, "ymin": 21.8, "xmax": 122.45, "ymax": 25.79, frequency: 30, minIcon: "Scripts/gis/ext/cloud/定量降水.jpg" },
            { name: "6-12小時", display: "II", url: "https://www.cwb.gov.tw/Data/fcst_img/QPF_ChFcstPrecip_6_12.png", "xmin": 118.94, "ymin": 21.8, "xmax": 122.45, "ymax": 25.79, frequency: 30, minIcon: "Scripts/gis/ext/cloud/定量降水.jpg" },
            { name: "6-18小時", display: "III", url: "https://www.cwb.gov.tw/Data/fcst_img/QPF_ChFcstPrecip_6_18.png", "xmin": 118.94, "ymin": 21.8, "xmax": 122.45, "ymax": 25.79, frequency: 30, minIcon: "Scripts/gis/ext/cloud/定量降水.jpg" },
            { name: "6-24小時", display: "IV", url: "https://www.cwb.gov.tw/Data/fcst_img/QPF_ChFcstPrecip_6_24.png", "xmin": 118.94, "ymin": 21.8, "xmax": 122.45, "ymax": 25.79, frequency: 30, minIcon: "Scripts/gis/ext/cloud/定量降水.jpg" }
        ]
    }
]