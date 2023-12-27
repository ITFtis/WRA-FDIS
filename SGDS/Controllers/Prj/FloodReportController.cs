using Dou.Misc.Attr;
using SGDS.Controllers.comm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [SGDSHtmlIFrameMenuDef(Id = "FloodReport", Name = "歷年淹水調查報告", MenuPath = "資料查詢", Action = "Index", Index =1, AllowAnonymous = false, Func = FuncEnum.None, Url = "https://www.dprcflood.org.tw/DPRC-TEST/FloodInvestigation")]
    public class FloodReportController : EmbedHtmlController
    {
        // GET: FloodReport
        public ActionResult Index()
        {
            return View();
        }
    }
}