using Dou.Misc.Attr;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.comm
{
    [AutoLogger]
    public class EmbedHtmlController : Dou.Controllers.HtmlIFrameController
    {
        protected override void OnActionExecuting(ActionExecutingContext ctx)
        {
            ViewBag.EmbedHtml = true;
            base.OnActionExecuting(ctx);
        }
    }
}