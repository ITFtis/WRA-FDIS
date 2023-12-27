using Dou.Misc.Attr;
using SGDS.Controllers.comm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [SGDSHtmlIFrameMenuDef(Id = "DDashboard", Name = "災情儀錶板", MenuPath = "情資查詢", Index = 1, Action = "Index",AllowAnonymous = false, Func = FuncEnum.None, Url = "DDashboard.html")]//?eventid=T2004")]
    public class DDashboardController : EmbedHtmlController
    {
        // GET: FDashboard
        public ActionResult Index()
        {
            return View();
        }
    }
}