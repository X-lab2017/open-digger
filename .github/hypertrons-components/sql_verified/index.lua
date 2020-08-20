-- Sql verified command
on('CommandEvent', function (e)
  if (e.command == compConfig.command) then
    addLabels(e.number, { compConfig.label })
  end
end)
