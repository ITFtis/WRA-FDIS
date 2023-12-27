using Dou.Misc.Attr;
using SGDS.Controllers.comm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [SGDSHtmlIFrameMenuDef(Id = "FloodReliabilityBeta", Name = "淹水感測器妥善率(Beta)", MenuPath = "資料查詢", Action = "Index", Index = 5, AllowAnonymous = false, Func = FuncEnum.None, Url = "https://www.dprcflood.org.tw/DPRC-TEST/Flood/FloodReliability")]
    public class FloodReliabilityBetaController : EmbedHtmlController
    {
        // GET: FloodReliability
        public ActionResult Index()
        {
            return View();
        }
    }
}