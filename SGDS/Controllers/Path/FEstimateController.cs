using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Path
{
    [Dou.Misc.Attr.MenuDef(Name = "淹水範圍推估", Index = 3, IsOnlyPath = true, Icon = "~/images/menu/menu_floodcal.png")]
    public class FEstimateController : Controller
    {
        // GET: FEstimate
        public ActionResult Index()
        {
            return View();
        }
    }
}