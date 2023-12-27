using Dou.Misc.Attr;
using SGDS.Controllers.comm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [SGDSHtmlIFrameMenuDef(Id = "FDashboard", Name = "多元水情整合圖台", MenuPath = "資料查詢", Action = "Index", Index = 2, AllowAnonymous = false, Func = FuncEnum.None, Url = "FDashboard.html")]
    public class FDashboardController : EmbedHtmlController
    {
        // GET: FDashboard
        public ActionResult Index()
        {
            return View();
        }
    }
}