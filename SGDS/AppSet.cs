using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SGDS
{
    
    public class AppSet
    {
        //水情影像雲端平台API
        public string WraFmgApiUrl { set; get; }
        //水利署Fhy
        public string WraFhyApiUrl { set; get; }
        //水利署Fhy api key
        public string WraFhyApiKey { set; get; }
        //六宮格歷史截圖資料查詢
        public string WraJavaJob { set; get; }
        //屏東水位
        public string PTWaterApiUrl { set; get; } 
        //桃園水位
        public string TYWaterApiUrl { set; get; }   
        //累計雨量圖
        public string CWBDayRainfallUrl { set; get; }
        //雷達回波圖
        public string CWBRadUrl { set; get; }
        //Qpeums預報1小時
        public string CWBQpf1h { set; get; }
    }
}