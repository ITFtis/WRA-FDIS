using Dou.Misc.Attr;
using SGDS.Controllers.comm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [SGDSHtmlIFrameMenuDef(Id = "FloodReliability", Name = "淹水感測器妥善率", MenuPath = "資料查詢", Action = "Index", Index = 3, AllowAnonymous = false, Func = FuncEnum.None, Url = "https://www.dprcflood.org.tw/FloodPrevention/flood/FloodReliability")]
    public class FloodReliabilityController : EmbedHtmlController
    {
        // GET: FloodReliability
        public ActionResult Index()
        {
            return View();
        }
    }
}